import { MenuBarExtra, Icon, Color, Image, environment, LaunchType, showHUD } from "@raycast/api";
import * as B from "fp-ts/boolean";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { useState, useEffect } from "react";

import { refreshCache, wait } from "./util/cache";
import { handleTaskEitherError } from "./util/error-handling";
import { MusicState } from "./util/models";
import { Icons, AppleMusicColor } from "./util/presets";
import * as music from "./util/scripts";
import { trimTitle } from "./util/utils";

export default function MenuBar() {
  const [state, setState] = useState<MusicState | undefined>(undefined);
  const [artwork, setArtwork] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadMusicState = async () => {
      if (environment.launchType === LaunchType.Background) {
        await refreshCache();
      } else {
        const state = await music.player.getMusicState();
        setState(state);
        if (state) {
          setArtwork(await music.track.getCurrentTrackArtwork());
        }
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
      <MenuBarExtra isLoading={isLoading} icon={Icons.Music} tooltip="Apple Music">
        <MenuBarExtra.Item title="Show Apple Music" onAction={pipe(music.player.activate, handleTaskEitherError())} />
      </MenuBarExtra>
    );
  }

  return (
    <MenuBarExtra isLoading={isLoading} icon={Icons.Music} tooltip="Apple Music">
      <MenuBarExtra.Item title={"Current Track"} />
      {
        <MenuBarExtra.Item
          title={trimTitle(state.title)}
          icon={{ source: artwork || "", mask: Image.Mask.Circle }}
          onAction={async () => {
            await pipe(
              music.player.revealTrack,
              handleTaskEitherError(() => showHUD("Failed to Reveal Track"))
            )();

            // if this fails we don't care too much.
            await pipe(music.player.activate, handleTaskEitherError())();
          }}
        />
      }
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title={`${state.playing ? "Pause" : "Play"} Track`}
        icon={state.playing ? Icon.Pause : Icon.Play}
        onAction={async () => {
          setState({ ...state, playing: !state.playing });
          await pipe(
            state.playing,
            B.foldW(
              () =>
                TE.tryCatch(
                  () => Promise.reject(new Error("Whoops")),
                  (e) => (e instanceof Error ? e : new Error(e as any))
                ) as TE.TaskEither<Error, string>,
              () => music.player.pause
            ),
            handleTaskEitherError(() => showHUD(`Could not ${state.playing ? "Pause" : "Play"} the track.`))
          )();
        }}
      />
      <MenuBarExtra.Item
        title="Repeat Mode"
        icon={state.repeat === "one" ? Icons.Repeat.One : state.repeat === "all" ? Icons.Repeat.All : Icons.Repeat.Off}
        onAction={async () => {
          const nextState = state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off";
          setState({ ...state, repeat: nextState });

          await handleTaskEitherError()(music.player.setRepeatMode(nextState))();
        }}
      />
      <MenuBarExtra.Item
        title="Shuffle Mode"
        icon={{ source: Icon.Shuffle, tintColor: state.shuffle ? AppleMusicColor : Color.PrimaryText }}
        onAction={async () => {
          setState({ ...state, shuffle: !state.shuffle });
          await pipe(
            music.player.setShuffle(!state.shuffle),
            handleTaskEitherError(() => showHUD("Failed to Shuffle"))
          )();
        }}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title="Next Track"
        icon={Icon.Forward}
        onAction={pipe(
          music.player.next,
          handleTaskEitherError(() => showHUD("Operation Failed"))
        )}
      />
      <MenuBarExtra.Item
        title="Previous Track"
        icon={Icon.Rewind}
        onAction={pipe(
          music.player.previous,
          handleTaskEitherError(() => showHUD("Operation Failed"))
        )}
      />
      <MenuBarExtra.Item
        title="Restart Track"
        icon={Icon.ArrowCounterClockwise}
        onAction={pipe(
          music.player.restart,
          handleTaskEitherError(() => showHUD("Failed to Restart"))
        )}
      />
      <MenuBarExtra.Separator />
      {!state.added && (
        <MenuBarExtra.Item
          title={"Add to Library"}
          icon={Icon.Plus}
          onAction={pipe(
            music.player.addToLibrary,
            handleTaskEitherError(
              () => showHUD("Failed to Add to Library"),
              async () => {
                showHUD("Added to Library");
                setState((s) => (s ? { ...s, added: true } : s));
                await wait(5);
                await refreshCache();
              }
            )
          )}
        />
      )}
      <MenuBarExtra.Item
        title={state.loved ? "Unlove Track" : "Love Track"}
        icon={state.loved ? Icon.HeartDisabled : Icon.Heart}
        onAction={async () => {
          setState({ ...state, loved: !state.loved });
          await pipe(
            music.player.toggleLove,
            handleTaskEitherError(
              () => showHUD("Failed to love"),
              () => showHUD("Loved")
            )
          )();
        }}
      />
      <MenuBarExtra.Submenu title="Set Rating" icon={Icons.Star}>
        {Array.from({ length: 6 }, (_, i) => i).map((i) => (
          <MenuBarExtra.Item
            key={i}
            title={`${i} ${i === state.rating ? "✓" : ""}`}
            onAction={async () => {
              await pipe(
                i * 20,
                music.player.setRating,
                TE.map(() => setState({ ...state, rating: i })),
                TE.mapLeft(() => showHUD("Add Track to Library to Set Rating"))
              )();
            }}
          />
        ))}
      </MenuBarExtra.Submenu>
      <MenuBarExtra.Separator />
      <MenuBarExtra.Submenu title="Set Volume" icon={Icon.SpeakerOn}>
        {Array.from({ length: 5 }, (_, i) => i).map((i) => (
          <MenuBarExtra.Item
            key={i}
            title={`${i * 25}`}
            onAction={pipe(
              music.player.setVolume(i * 25),
              handleTaskEitherError(() => showHUD("Failed to rate"))
            )}
          />
        ))}
      </MenuBarExtra.Submenu>
    </MenuBarExtra>
  );
}
