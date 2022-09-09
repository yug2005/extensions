import { MenuBarExtra, Icon, Image, environment, LaunchType, showHUD } from "@raycast/api";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { useState, useEffect } from "react";

import * as music from "./scripts";
import { refreshCache } from "./util/cache";
import { MusicState, PlayerState, Playlist } from "./util/models";
import { parseResult, parseMusicState } from "./util/parser";
import { repeatModes, Icons, FallbackImages } from "./util/presets";
import { handleTaskEitherError, trimTitle } from "./util/utils";

export default function MenuBar() {
  const [state, setState] = useState<MusicState>();
  const [playlists, setPlaylists] = useState<readonly Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (environment.launchType === LaunchType.Background) {
      refreshCache().then(() => setIsLoading(false));
    } else {
      pipe(
        music.player.getMusicState,
        TE.map(
          flow(parseResult<MusicState>(), parseMusicState, (state) => {
            setState(state);
            if (state.playing !== PlayerState.Stopped) {
              setIsLoading(false);
            } else {
              music.playlists
                .getPlaylists()
                .then(setPlaylists)
                .then(() => setIsLoading(false));
            }
          })
        ),
        handleTaskEitherError
      )();
    }
  }, []);

  return state && state.playing !== PlayerState.Stopped ? (
    <MenuBarExtra isLoading={isLoading} icon={Icons.Music} tooltip={"Apple Music"}>
      <MenuBarExtra.Item title={"Current Track"} />
      <MenuBarExtra.Item
        icon={Icons.Song}
        title={trimTitle(`${state.name} - ${state.artist}`)}
        onAction={handleTaskEitherError(music.player.showTrack)}
      />
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title={`${state.playing === PlayerState.Playing ? "Pause" : "Play"} Track`}
          icon={state.playing === PlayerState.Playing ? Icons.Pause : Icons.Play}
          onAction={pipe(
            state.playing === PlayerState.Playing ? music.player.pause : music.player.play,
            TE.map(() =>
              setState({
                ...state,
                playing: state.playing === PlayerState.Playing ? PlayerState.Paused : PlayerState.Playing,
              })
            ),
            handleTaskEitherError
          )}
        />
        <MenuBarExtra.Item title={"Next Track"} icon={Icons.Next} onAction={handleTaskEitherError(music.player.next)} />
        <MenuBarExtra.Item
          title={"Previous Track"}
          icon={Icons.Previous}
          onAction={handleTaskEitherError(music.player.previous)}
        />
        <MenuBarExtra.Item
          title={"Restart Track"}
          icon={Icons.Restart}
          onAction={handleTaskEitherError(music.player.restart)}
        />
      </MenuBarExtra.Section>
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title={"Toggle Shuffle"}
          icon={state.shuffle ? Icons.Shuffle.Enabled : Icons.Shuffle.Disabled}
          onAction={pipe(
            music.player.toggleShuffle,
            TE.map(() => setState({ ...state, shuffle: !state.shuffle })),
            handleTaskEitherError
          )}
        />
        <MenuBarExtra.Submenu title={"Repeat Mode"} icon={repeatModes[state.repeat].icon}>
          {Object.entries(repeatModes).map(([key, mode]) => (
            <MenuBarExtra.Item
              key={key}
              title={mode.title}
              icon={mode.icon}
              onAction={() => {
                if (key !== state.repeat) {
                  setState({ ...state, repeat: key });
                  pipe(key, music.player.setRepeatMode, handleTaskEitherError)();
                }
              }}
            />
          ))}
        </MenuBarExtra.Submenu>
        <MenuBarExtra.Submenu title={"Set Volume"} icon={Icons.Audio}>
          {Array.from({ length: 5 }, (_, i) => i * 25).map((volume) => (
            <MenuBarExtra.Item
              key={volume}
              title={volume.toString()}
              onAction={handleTaskEitherError(music.player.setVolume(volume))}
            />
          ))}
        </MenuBarExtra.Submenu>
      </MenuBarExtra.Section>
      <MenuBarExtra.Section>
        {!state.inLibrary && (
          <MenuBarExtra.Item
            title={"Add to Library"}
            icon={Icon.Plus}
            onAction={pipe(
              music.player.addToLibrary,
              TE.map(() => {
                showHUD("Added to Library");
                setState({ ...state, inLibrary: true });
              }),
              handleTaskEitherError
            )}
          />
        )}
        <MenuBarExtra.Item
          title={state.favorited ? "Unfavorite Track" : "Favorite Track"}
          icon={state.favorited ? Icon.HeartDisabled : Icon.Heart}
          onAction={pipe(
            music.player.toggleFavorite,
            TE.map(() => setState({ ...state, favorited: !state.favorited })),
            handleTaskEitherError
          )}
        />
        {state.inLibrary && (
          <MenuBarExtra.Submenu title={"Set Rating"} icon={Icons.Star}>
            {Array.from({ length: 6 }, (_, i) => i).map((i) => (
              <MenuBarExtra.Item
                key={i}
                title={`${i} ${i === state.rating ? "✓" : ""}`}
                onAction={pipe(
                  i * 20,
                  music.player.setRating,
                  TE.map(() => setState({ ...state, rating: i })),
                  handleTaskEitherError
                )}
              />
            ))}
          </MenuBarExtra.Submenu>
        )}
      </MenuBarExtra.Section>
    </MenuBarExtra>
  ) : (
    <MenuBarExtra isLoading={isLoading} icon={Icons.Music} tooltip={"Apple Music"}>
      <MenuBarExtra.Item title={"Show Apple Music"} onAction={handleTaskEitherError(music.player.activate)} />
      <MenuBarPlaylists playlists={playlists} />
    </MenuBarExtra>
  );
}

const MenuBarPlaylists = ({ playlists }: { playlists: readonly Playlist[] }) => (
  <MenuBarExtra.Section>
    {playlists.map((playlist) => (
      <MenuBarExtra.Submenu
        key={playlist.id}
        title={playlist.name}
        icon={{ source: playlist.artwork || FallbackImages.NoPlaylist, mask: Image.Mask.Circle }}
      >
        <MenuBarExtra.Item
          title={"Play Playlist"}
          icon={Icons.Play}
          onAction={pipe(playlist, music.playlists.play(false), handleTaskEitherError)}
        />
        <MenuBarExtra.Item
          title={"Shuffle Playlist"}
          icon={Icons.Shuffle.Default}
          onAction={pipe(playlist, music.playlists.play(true), handleTaskEitherError)}
        />
        <MenuBarExtra.Item
          title={"Show in Music"}
          icon={Icons.Music}
          onAction={pipe(playlist, music.playlists.show, handleTaskEitherError)}
        />
      </MenuBarExtra.Submenu>
    ))}
  </MenuBarExtra.Section>
);
