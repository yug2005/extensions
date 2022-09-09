import { MenuBarExtra, Icon, Color, Image, environment, LaunchType } from "@raycast/api";
import { useState, useEffect } from "react";
import { handleTaskEitherError, trimTitle } from "./util/utils";
import { getCurrentTrackArtwork } from "./util/artwork";
import * as music from "./util/scripts";
import { MusicState, Playlist } from "./util/models";
import { getAllTracks } from "./util/scripts/track";
import { getPlaylists, getPlaylistTracks } from "./util/scripts/playlists";

const AppleMusicColor = "#fb556d";
const MusicIcon = {
  source: {
    light: "../assets/music-light.svg",
    dark: "../assets/music-dark.svg",
  },
};

export default function MenuBar() {
  const refreshCache = async () => {
    await getAllTracks(false);
    const playlists = await getPlaylists(false);
    const promises = playlists.map((playlist: Playlist) => getPlaylistTracks(playlist.id, false));
    await Promise.all(promises);
  };

  const [state, setState] = useState<MusicState | undefined>(undefined);
  const [artwork, setArtwork] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadMusicState = async () => {
      if (environment.launchType === LaunchType.Background) {
        await refreshCache();
      }
      const state = await music.player.getMusicState();
      setState(state);
      if (state) {
        setArtwork(await getCurrentTrackArtwork());
      }
      setIsLoading(false);
    };
    loadMusicState();
    return () => {
      setState(undefined);
      setArtwork(undefined);
      setIsLoading(true);
    };
  }, []);

  if (isLoading || state === undefined) {
    return (
      <MenuBarExtra isLoading={isLoading} icon={MusicIcon} tooltip="Apple Music">
        <MenuBarExtra.Item
          title="Show Apple Music"
          onAction={async () => {
            await handleTaskEitherError(music.player.activate)();
          }}
        />
      </MenuBarExtra>
    );
  }

  return (
    <MenuBarExtra isLoading={isLoading} icon={MusicIcon} tooltip="Apple Music">
      <MenuBarExtra.Item title={"Current Track"} />
      {
        <MenuBarExtra.Item
          title={trimTitle(state.title)}
          icon={{ source: artwork || "", mask: Image.Mask.Circle }}
          onAction={async () => {
            await handleTaskEitherError(music.player.revealTrack)();
          }}
        />
      }
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title={`${state.playing ? "Pause" : "Play"} Track`}
        icon={state.playing ? Icon.Pause : Icon.Play}
        onAction={async () => {
          setState({ ...state, playing: !state.playing });
          await handleTaskEitherError(state.playing ? music.player.pause : music.player.play)();
        }}
      />
      <MenuBarExtra.Item
        title="Repeat Mode"
        icon={{
          source: state.repeat === "one" ? "../assets/repeat-one.png" : "../assets/repeat.png",
          tintColor: state.repeat === "off" ? Color.PrimaryText : AppleMusicColor,
        }}
        onAction={async () => {
          const nextState = state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off";
          setState({ ...state, repeat: nextState });
          await handleTaskEitherError(music.player.setRepeatMode(nextState))();
        }}
      />
      <MenuBarExtra.Item
        title="Shuffle Mode"
        icon={{ source: Icon.Shuffle, tintColor: state.shuffle ? AppleMusicColor : Color.PrimaryText }}
        onAction={async () => {
          setState({ ...state, shuffle: !state.shuffle });
          await handleTaskEitherError(music.player.setShuffle(!state.shuffle))();
        }}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title="Restart Track"
        icon={Icon.ArrowCounterClockwise}
        onAction={async () => {
          await handleTaskEitherError(music.player.restart)();
        }}
      />
      <MenuBarExtra.Item
        title="Next Track"
        icon={Icon.Forward}
        onAction={async () => {
          await handleTaskEitherError(music.player.next)();
        }}
      />
      <MenuBarExtra.Item
        title="Previous Track"
        icon={Icon.Rewind}
        onAction={async () => {
          await handleTaskEitherError(music.player.previous)();
        }}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title={state.loved ? "Unlove Track" : "Love Track"}
        icon={state.loved ? Icon.HeartDisabled : Icon.Heart}
        onAction={async () => {
          setState({ ...state, loved: !state.loved });
          await handleTaskEitherError(music.player.toggleLove)();
        }}
      />
      {!state.added && (
        <MenuBarExtra.Item
          title={"Add to Library"}
          icon={Icon.Plus}
          onAction={async () => {
            setState({ ...state, added: true });
            await handleTaskEitherError(music.player.addToLibrary)();
          }}
        />
      )}
      <MenuBarExtra.Separator />
      <MenuBarExtra.Submenu title="Set Volume" icon={Icon.SpeakerOn}>
        {Array.from({ length: 5 }, (_, i) => i).map((i) => (
          <MenuBarExtra.Item
            key={i}
            title={`${i * 25}`}
            onAction={async () => {
              await handleTaskEitherError(music.player.setVolume(i * 10))();
            }}
          />
        ))}
      </MenuBarExtra.Submenu>
    </MenuBarExtra>
  );
}
