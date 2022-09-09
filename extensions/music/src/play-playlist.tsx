import { Action, ActionPanel, Icon, Image, closeMainWindow, useNavigation } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { useEffect, useState } from "react";

import { PlaylistDetail } from "./components/playlist-detail";
import { PlaylistTracks } from "./components/playlist-tracks";
import * as music from "./scripts";
import {
  ListOrGrid,
  ListOrGridItem,
  ListOrGridDropdown,
  ListOrGridDropdownItem,
  ListOrGridSection,
  gridColumns,
  mainLayout,
} from "./util/list-or-grid";
import { Playlist, PlaylistKind, LayoutType } from "./util/models";
import { FallbackImages, Icons } from "./util/presets";
import { handleTaskEitherError } from "./util/utils";

export default function PlayPlaylist() {
  const [playlists, setPlaylists] = useState<readonly Playlist[]>([]);
  const [playlistKind, setPlaylistKind] = useState<PlaylistKind>(PlaylistKind.ALL);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showPlaylistDetail, setShowPlaylistDetail] = useState<boolean>(true);
  const togglePlaylistDetail = () => setShowPlaylistDetail(!showPlaylistDetail);

  useEffect(() => {
    music.playlists
      .getPlaylists()
      .then(setPlaylists)
      .then(() => setIsLoading(false));
  }, []);

  return (
    <ListOrGrid
      isLoading={isLoading}
      searchBarPlaceholder={"Search playlists"}
      columns={gridColumns}
      isShowingDetail={showPlaylistDetail}
      layoutType={mainLayout}
      searchBarAccessory={
        <ListOrGridDropdown
          tooltip={"Playlist Kind"}
          value={playlistKind}
          defaultValue={PlaylistKind.ALL}
          onChange={(kind) => setPlaylistKind(kind as PlaylistKind)}
          layoutType={mainLayout}
        >
          <ListOrGridDropdownItem title={"All Playlists"} value={PlaylistKind.ALL} layoutType={mainLayout} />
          <ListOrGridDropdownItem title={"User Playlists"} value={PlaylistKind.USER} layoutType={mainLayout} />
          <ListOrGridDropdownItem title={"Apple Music"} value={PlaylistKind.SUBSCRIPTION} layoutType={mainLayout} />
        </ListOrGridDropdown>
      }
    >
      {Object.values(PlaylistKind)
        .filter((kind) => playlistKind === PlaylistKind.ALL || kind === playlistKind)
        .map((kind) => (
          <ListOrGridSection
            key={kind}
            title={kind === PlaylistKind.USER ? "Your Library" : "Apple Music"}
            layoutType={mainLayout}
          >
            {playlists
              .filter((playlist) => playlist.kind === kind)
              .map((playlist) => (
                <PlaylistItem
                  key={playlist.id}
                  playlist={playlist}
                  showDetail={showPlaylistDetail}
                  toggle={togglePlaylistDetail}
                />
              ))}
          </ListOrGridSection>
        ))}
    </ListOrGrid>
  );
}

interface PlaylistProps {
  playlist: Playlist;
  showDetail?: boolean;
  toggle?: () => void;
}

export const PlaylistItem = (props: PlaylistProps) => {
  const { playlist, showDetail } = props;
  return (
    <ListOrGridItem
      key={playlist.id}
      id={playlist.id}
      layoutType={mainLayout}
      title={playlist.name}
      subtitle={mainLayout === LayoutType.Grid ? `${playlist.count} tracks` : undefined}
      accessories={showDetail ? null : [{ text: `${playlist.count} tracks` }]}
      content={playlist.artwork || FallbackImages.NoPlaylist}
      icon={{
        source: playlist.artwork || FallbackImages.NoTrack,
        mask: mainLayout === LayoutType.Grid ? undefined : Image.Mask.RoundedRectangle,
      }}
      detail={<PlaylistDetail playlist={playlist} />}
      actions={<Actions {...props} />}
    />
  );
};

const Actions = ({ playlist, toggle }: PlaylistProps) => {
  const { pop } = useNavigation();

  const playPlaylist = (shuffle?: boolean) =>
    pipe(
      playlist,
      music.playlists.play(shuffle),
      TE.map(() => {
        pop();
        closeMainWindow();
      }),
      handleTaskEitherError
    );

  return (
    <ActionPanel title={playlist.name}>
      <Action title={"Start Playlist"} icon={Icons.Play} onAction={playPlaylist(false)} />
      <Action title={"Shuffle Playlist"} icon={Icons.Shuffle.Default} onAction={playPlaylist(true)} />
      <Action.Push
        title={"Show Playlist Tracks"}
        icon={Icon.BulletPoints}
        shortcut={{ modifiers: ["cmd"], key: "o" }}
        target={<PlaylistTracks playlist={playlist} />}
      />
      <Action
        title={"Show in Apple Music"}
        icon={Icons.Music}
        shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
        onAction={pipe(
          playlist,
          music.playlists.show,
          TE.map(() => closeMainWindow()),
          handleTaskEitherError
        )}
      />
      <ActionPanel.Section>
        {mainLayout === LayoutType.List && (
          <Action
            title={"Toggle Playlist Detail"}
            icon={Icon.AppWindowSidebarLeft}
            onAction={toggle}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
          />
        )}
      </ActionPanel.Section>
    </ActionPanel>
  );
};
