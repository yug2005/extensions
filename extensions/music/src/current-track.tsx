import { Detail, Action, ActionPanel, Icon, Toast, showToast, showHUD, Color, closeMainWindow } from "@raycast/api";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import json2md from "json2md";
import React, { useEffect, useState } from "react";

import { NoTrack } from "./components/no-track";
import { AddToPlaylistAction } from "./components/playlist-actions";
import { SetVolume } from "./components/set-volume";
import { DetailMetadata } from "./components/track-detail";
import * as music from "./scripts";
import { MusicState, PlayerState, Track } from "./util/models";
import { parseResult, parseMusicState } from "./util/parser";
import { repeatModes, Icons } from "./util/presets";
import { handleTaskEitherError } from "./util/utils";

export default function CurrentTrack() {
  const [track, setTrack] = useState<Track>();
  const [state, setState] = useState<MusicState>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    pipe(
      music.player.getMusicState,
      TE.map(
        flow(parseResult<MusicState>(), parseMusicState, (state) => {
          setState(state);
          if (state.playing !== PlayerState.Stopped) {
            music.track
              .getCurrentTrackDetails()
              .then(setTrack)
              .then(() => setIsLoading(false));
          }
        })
      ),
      handleTaskEitherError
    )();
  }, [refresh]);

  const items: json2md.DataObject[] = [];
  if (track) {
    items.push({ h1: track.name });
    if (track.artwork) {
      items.push({ img: { title: track.name, source: track.artwork } });
    }
  }
  const markdown = json2md(items);

  return state?.playing === PlayerState.Stopped ? (
    <NoTrack />
  ) : (
    <Detail
      navigationTitle={track?.name}
      isLoading={isLoading}
      markdown={markdown}
      metadata={track && <DetailMetadata track={track} />}
      actions={
        track &&
        state && (
          <ActionPanel>
            <ActionPanel.Section>
              <Action
                title={state.playing === PlayerState.Playing ? "Pause" : "Play"}
                icon={state.playing === PlayerState.Playing ? Icons.Pause : Icons.Play}
                onAction={pipe(
                  music.player.togglePlay,
                  TE.map(() =>
                    setState({
                      ...state,
                      playing: state.playing === PlayerState.Playing ? PlayerState.Paused : PlayerState.Playing,
                    })
                  ),
                  handleTaskEitherError
                )}
              />
              <Action
                title={"Show Track"}
                icon={Icons.Music}
                onAction={pipe(
                  music.player.showTrack,
                  TE.map(() => closeMainWindow()),
                  handleTaskEitherError
                )}
              />
            </ActionPanel.Section>
            <ActionPanel.Section>
              <Action
                title={"Next Track"}
                icon={Icons.Next}
                shortcut={{ modifiers: [], key: "arrowRight" }}
                onAction={pipe(
                  music.player.next,
                  TE.map(() => setRefresh(!refresh)),
                  handleTaskEitherError
                )}
              />
              <Action
                title={"Previous Track"}
                icon={Icons.Previous}
                shortcut={{ modifiers: [], key: "arrowLeft" }}
                onAction={pipe(
                  music.player.previous,
                  TE.map(() => setRefresh(!refresh)),
                  handleTaskEitherError
                )}
              />
              <Action
                title={"Restart Track"}
                shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
                icon={Icons.Restart}
                onAction={handleTaskEitherError(music.player.restart)}
              />
            </ActionPanel.Section>
            <ActionPanel.Section>
              <Action
                title={"Toggle Shuffle"}
                shortcut={{ modifiers: ["cmd"], key: "s" }}
                icon={Icons.Shuffle.Default}
                onAction={pipe(
                  music.player.toggleShuffle,
                  TE.map(() => {
                    setState({ ...state, shuffle: !state.shuffle });
                    showToast(Toast.Style.Success, `Shuffle Mode ${state.shuffle ? "Disabled" : "Enabled"}`);
                  }),
                  handleTaskEitherError
                )}
              />
              <ActionPanel.Submenu
                title={"Set Repeat Mode"}
                icon={Icons.Repeat.Default}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              >
                {Object.entries(repeatModes).map(([key, mode]) => (
                  <Action
                    key={key}
                    title={mode.title}
                    icon={mode.icon}
                    onAction={() => {
                      if (key !== state.repeat) {
                        pipe(
                          key,
                          music.player.setRepeatMode,
                          TE.map(() => {
                            setState({ ...state, repeat: key });
                            showToast(Toast.Style.Success, `Repeat Mode Set to ${mode.title}`);
                          }),
                          handleTaskEitherError
                        )();
                      } else {
                        showToast(Toast.Style.Success, `Repeat Mode Already Set to ${mode.title}`);
                      }
                    }}
                  />
                ))}
              </ActionPanel.Submenu>
              <Action.Push
                title={"Set Volume"}
                icon={Icon.SpeakerOn}
                shortcut={{ modifiers: ["cmd"], key: "v" }}
                target={<SetVolume />}
              />
            </ActionPanel.Section>
            <ActionPanel.Section title={track && `${track.name} - ${track.artist}`}>
              {!track.inLibrary ? (
                <Action
                  title={"Add to Library"}
                  icon={Icon.Plus}
                  shortcut={{ modifiers: ["cmd"], key: "a" }}
                  onAction={pipe(
                    music.player.addToLibrary,
                    TE.map(() => {
                      setState({ ...state, inLibrary: true });
                      setTrack({ ...track, inLibrary: true });
                      showToast(Toast.Style.Success, "Added to Library");
                    }),
                    handleTaskEitherError
                  )}
                />
              ) : (
                <AddToPlaylistAction track={track} />
              )}
              <Action
                title={`${track.favorited ? "Unfavorite" : "Favorite"} Track`}
                icon={{ ...(track.favorited ? Icons.Heart : Icons.HeartFilled), tintColor: Color.PrimaryText }}
                shortcut={{ modifiers: ["cmd"], key: "l" }}
                onAction={pipe(
                  music.player.toggleFavorite,
                  TE.map(() => {
                    setState({ ...state, favorited: !state.favorited });
                    setTrack({ ...track, favorited: !track.favorited });
                    showToast(Toast.Style.Success, `${track.favorited ? "Unfavorited" : "Favorited"} Track`);
                  }),
                  handleTaskEitherError
                )}
              />
              <Action
                title={`${track.disliked ? "Undislike" : "Dislike"} Track`}
                icon={{ ...(track.disliked ? Icons.Dislike : Icons.DislikeFilled), tintColor: Color.PrimaryText }}
                shortcut={{ modifiers: ["cmd"], key: "d" }}
                onAction={pipe(
                  music.player.toggleDislike,
                  TE.map(() => {
                    setState({ ...state, disliked: !state.disliked });
                    setTrack({ ...track, disliked: !track.disliked });
                    showToast(Toast.Style.Success, `${track.disliked ? "Undisliked" : "Disliked"} Track`);
                  }),
                  handleTaskEitherError
                )}
              />
              {track.inLibrary && (
                <React.Fragment>
                  <ActionPanel.Submenu
                    title={"Set Rating"}
                    icon={Icon.Star}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
                  >
                    {Array.from({ length: 6 }, (_, i) => i).map((rating) => (
                      <Action
                        key={rating}
                        title={`${rating} Star${rating === 1 ? "" : "s"}`}
                        icon={track.rating === rating ? Icons.StarFilled : Icons.Star}
                        onAction={pipe(
                          rating * 20,
                          music.player.setRating,
                          TE.map(() => {
                            setState({ ...state, rating });
                            setTrack({ ...track, rating });
                            showToast(Toast.Style.Success, `Set Rating to ${rating} Star${rating === 1 ? "" : "s"}`);
                          }),
                          handleTaskEitherError
                        )}
                      />
                    ))}
                  </ActionPanel.Submenu>
                  <Action
                    title={"Delete from Library"}
                    icon={{ source: Icon.Trash, tintColor: Color.Red }}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={pipe(
                      music.player.deleteFromLibrary,
                      TE.map(() => showHUD("Deleted from Library")),
                      handleTaskEitherError
                    )}
                  />
                </React.Fragment>
              )}
            </ActionPanel.Section>
          </ActionPanel>
        )
      }
    />
  );
}
