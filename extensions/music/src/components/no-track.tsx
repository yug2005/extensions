import { List, ActionPanel, Action } from "@raycast/api";

import PlayAlbum from "../play-album";
import PlayPlaylist from "../play-playlist";
import PlayTrack from "../play-track";
import * as music from "../scripts";
import { Icons } from "../util/presets";
import { handleTaskEitherError } from "../util/utils";

export const NoTrack = () => {
  return (
    <List
      actions={
        <ActionPanel>
          <Action.Push title={"Play Track"} icon={Icons.Play} target={<PlayTrack />} />
          <Action.Push title={"Play Album"} icon={Icons.Album} target={<PlayAlbum />} />
          <Action.Push
            title={"Play Playlist"}
            icon={Icons.Playlist}
            shortcut={{ modifiers: ["cmd"], key: "p" }}
            target={<PlayPlaylist />}
          />
          <Action
            title={"Show Apple Music"}
            icon={Icons.Music}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
            onAction={handleTaskEitherError(music.player.activate)}
          />
        </ActionPanel>
      }
    >
      <List.EmptyView
        title={"No Track Playing"}
        icon={Icons.NotPlaying}
        description={"Use Raycast or Apple Music to start a track"}
      />
    </List>
  );
};
