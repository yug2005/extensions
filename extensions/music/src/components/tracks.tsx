import { Action, ActionPanel, closeMainWindow, Icon, getPreferenceValues, Image, showHUD } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import Fuse from "fuse.js";
import _ from "lodash";
import { useEffect, useState } from "react";

import * as music from "../scripts";
import { refreshCache } from "../util/cache";
import {
  ListOrGrid,
  ListOrGridItem,
  ListOrGridDropdown,
  ListOrGridDropdownItem,
  ListOrGridDropdownSection,
  gridColumns,
  mainLayout,
  albumTracksLayout,
} from "../util/list-or-grid";
import { Track, Playlist, SortOption, TrackDropdownOption, LayoutType, Preferences } from "../util/models";
import { FallbackImages, Icons } from "../util/presets";
import { sortCache, handleTaskEitherError } from "../util/utils";
import { AddToPlaylistAction } from "./playlist-actions";
import { TrackDetail } from "./track-detail";

interface TracksProps {
  tracks: readonly Track[];
  isLoading?: boolean;
  overrideLayout?: LayoutType;
  isAlbum?: boolean;
  playlist?: Playlist;
}

export const Tracks = (props: TracksProps): JSX.Element => {
  const layout = props.overrideLayout || mainLayout;
  const { trackDropdown } = getPreferenceValues<Preferences>();

  const [search, setSearch] = useState<string>("");

  const [genre, setGenre] = useState<string>("");
  const [sort, setSort] = useState<SortOption>((sortCache.get("track-sort") as SortOption) || SortOption.DateAdded);

  const [showTrackDetail, setShowTrackDetail] = useState<boolean>(true);
  const toggleTrackDetail = () => setShowTrackDetail(!showTrackDetail);

  return (
    <ListOrGrid
      isLoading={props.isLoading}
      searchBarPlaceholder={`Search a track by title${props.isAlbum ? "" : ", album, or artist"}`}
      onSearchTextChange={setSearch}
      columns={gridColumns}
      isShowingDetail={showTrackDetail}
      layoutType={layout}
      searchBarAccessory={
        props.isAlbum ? undefined : trackDropdown === TrackDropdownOption.SortBy ? (
          <ListOrGridDropdown
            tooltip={"Sort By"}
            defaultValue={sort}
            layoutType={layout}
            onChange={(value: string) => {
              setSort(value as SortOption);
              sortCache.set("track-sort", value);
            }}
          >
            {Object.values(SortOption).map((option) => (
              <ListOrGridDropdownItem key={option} value={option} title={option} layoutType={layout} />
            ))}
          </ListOrGridDropdown>
        ) : (
          <ListOrGridDropdown tooltip={"Genres"} onChange={setGenre} layoutType={layout}>
            <ListOrGridDropdownItem value={""} title={"All Genres"} layoutType={layout} />
            <ListOrGridDropdownSection layoutType={layout}>
              {Array.from(new Set(props.tracks.map((track) => track.genre)))
                .sort((a, b) => a.localeCompare(b))
                .map((genre: string, index: number) => (
                  <ListOrGridDropdownItem key={index} title={genre} value={genre} layoutType={layout} />
                ))}
            </ListOrGridDropdownSection>
          </ListOrGridDropdown>
        )
      }
    >
      {(() => {
        const tracks = props.tracks.filter((track) => track.genre === genre || !genre);
        if (search) {
          const fuse = new Fuse(tracks, {
            keys: ["name", "artist", "album"],
            threshold: 0.3,
            ignoreLocation: true,
          });
          return fuse.search(search).map((result) => result.item);
        } else {
          if (sort === SortOption.DateAdded) return _.sortBy(tracks, ["dateAdded"]).reverse();
          else if (sort === SortOption.Artist) return _.sortBy(tracks, ["artist", "album", "name"]);
          else if (sort === SortOption.Album) return _.sortBy(tracks, ["album", "name"]);
          else if (sort === SortOption.Title) return _.sortBy(tracks, ["name"]);
          else if (sort === SortOption.PlayedCount) return _.sortBy(tracks, ["playedCount"]).reverse();
          else if (sort === SortOption.PlayedDuration) {
            return tracks.sort((a, b) => b.playedCount * b.duration - a.playedCount * a.duration);
          } else if (sort === SortOption.Random) return _.shuffle(tracks);
          else return tracks;
        }
      })().map((track) => (
        <TrackItem
          key={track.id}
          track={track}
          layout={layout}
          showDetail={showTrackDetail}
          toggle={toggleTrackDetail}
          {...props}
        />
      ))}
    </ListOrGrid>
  );
};

interface TrackProps {
  track: Track;
  layout: LayoutType;
  playlist?: Playlist;
  isAlbum?: boolean;
  showDetail?: boolean;
  toggle?: () => void;
}

export const TrackItem = (props: TrackProps) => {
  const { track, layout, showDetail } = props;
  return (
    <ListOrGridItem
      key={track.id}
      id={track.id}
      layoutType={layout}
      title={track.name}
      subtitle={layout === LayoutType.Grid ? track.artist : undefined}
      accessories={showDetail ? null : [{ text: track.artist }]}
      content={track.artwork || FallbackImages.NoTrack}
      icon={{
        source: track.artwork || FallbackImages.NoTrack,
        mask: layout === LayoutType.Grid ? undefined : Image.Mask.RoundedRectangle,
      }}
      detail={<TrackDetail track={track} />}
      actions={<Actions {...props} />}
    />
  );
};

const Actions = ({ track, layout, playlist, isAlbum, toggle }: TrackProps) => {
  return (
    <ActionPanel title={`${track.name} - ${track.artist}`}>
      <Action
        title={"Play Track"}
        icon={Icons.Play}
        onAction={pipe(
          track,
          isAlbum
            ? music.track.playFromAlbum
            : playlist
            ? music.track.playFromPlaylist(playlist, false)
            : music.track.play,
          TE.map(() => closeMainWindow()),
          handleTaskEitherError
        )}
      />
      <Action
        title={"Play on Repeat"}
        icon={Icons.Repeat.Default}
        onAction={pipe(
          track,
          playlist ? music.track.playFromPlaylist(playlist, true) : music.track.playOnRepeat,
          TE.map(() => closeMainWindow()),
          handleTaskEitherError
        )}
      />
      <Action
        title={"Show Track"}
        icon={Icons.Music}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
        onAction={pipe(
          track,
          music.track.showTrack,
          TE.map(() => closeMainWindow()),
          handleTaskEitherError
        )}
      />
      {!isAlbum && (
        <ActionPanel.Section title={`${track.album} - ${track.artist}`}>
          <Action
            title={"Play Album"}
            icon={Icons.Play}
            shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
            onAction={async () => {
              pipe(
                await music.albums.getAlbumOfTrack(track),
                music.albums.play(false),
                TE.map(() => closeMainWindow()),
                handleTaskEitherError
              )();
            }}
          />
          <Action
            title={"Shuffle Album"}
            icon={Icons.Shuffle.Default}
            shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
            onAction={async () => {
              pipe(
                await music.albums.getAlbumOfTrack(track),
                music.albums.play(true),
                TE.map(() => closeMainWindow()),
                handleTaskEitherError
              )();
            }}
          />
          {!isAlbum && (
            <Action.Push
              title={"Show Tracks"}
              icon={Icon.BulletPoints}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
              target={<AlbumTracks track={track} />}
            />
          )}
        </ActionPanel.Section>
      )}
      <ActionPanel.Section>
        {playlist === undefined ? (
          <AddToPlaylistAction track={track} shortcut={{ modifiers: ["cmd", "shift"], key: "p" }} />
        ) : (
          <Action
            title={"Remove from Playlist"}
            icon={Icons.Delete}
            shortcut={{ modifiers: ["ctrl"], key: "x" }}
            onAction={pipe(
              music.playlists.removeFromPlaylist(playlist, track),
              TE.map(() => {
                showHUD("Removed from Playlist");
                refreshCache();
              }),
              handleTaskEitherError
            )}
          />
        )}
      </ActionPanel.Section>
      <ActionPanel.Section>
        {layout === LayoutType.List && (
          <Action
            title={"Toggle Track Detail"}
            icon={Icon.AppWindowSidebarLeft}
            onAction={toggle}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
          />
        )}
      </ActionPanel.Section>
    </ActionPanel>
  );
};

const AlbumTracks = (props: { track: Track }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    music.albums.getAlbumOfTrack(props.track).then((album) => {
      setTracks(album.tracks);
      setIsLoading(false);
    });
  }, []);

  return <Tracks isLoading={isLoading} tracks={tracks} overrideLayout={albumTracksLayout} isAlbum={true} />;
};
