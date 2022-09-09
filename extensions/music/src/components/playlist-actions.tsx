import { List, Action, ActionPanel, Icon, Toast, showToast, Image, Keyboard } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { useEffect, useState } from "react";

import * as music from "../scripts";
import { refreshCache } from "../util/cache";
import { Track, Playlist } from "../util/models";
import { FallbackImages } from "../util/presets";

export const AddToPlaylistAction = (props: { track: Track; shortcut?: Keyboard.Shortcut }) => (
  <Action.Push
    title={"Add to Playlist"}
    icon={Icon.Plus}
    shortcut={props.shortcut || { modifiers: ["cmd", "shift"], key: "p" }}
    target={<AddToPlaylist track={props.track} />}
  />
);

const AddToPlaylist = ({ track }: { track: Track }) => {
  const [playlists, setPlaylists] = useState<readonly Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    music.playlists
      .getPlaylists()
      .then(setPlaylists)
      .then(() => setIsLoading(false));
  }, []);

  return (
    <List isLoading={isLoading} navigationTitle={"Add to Playlist"} searchBarPlaceholder={"Search Playlist"}>
      {playlists.map((playlist) => (
        <List.Item
          key={playlist.id}
          title={playlist.name}
          accessories={[{ text: `${playlist.count} Tracks` }]}
          icon={{ source: playlist.artwork || FallbackImages.NoPlaylist, mask: Image.Mask.RoundedRectangle }}
          actions={
            <ActionPanel>
              <Action
                title={"Add to Playlist"}
                icon={Icon.Plus}
                onAction={pipe(
                  music.playlists.addTrackToPlaylist(playlist, track),
                  TE.map(() => {
                    showToast(Toast.Style.Success, `Added ${track.name} to ${playlist.name}`);
                    refreshCache();
                  })
                )}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
};
