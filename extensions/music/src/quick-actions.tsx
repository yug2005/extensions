import { List, ActionPanel, Action, Icon, Color, Image, showToast, Toast, showHUD } from "@raycast/api";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import React, { useState, useEffect } from "react";

import { NoTrack } from "./components/no-track";
import { AddToPlaylistAction } from "./components/playlist-actions";
import { SetVolume } from "./components/set-volume";
import { TrackDetail } from "./components/track-detail";
import * as music from "./scripts";
import { Track, MusicState, PlayerState } from "./util/models";
import { parseResult, parseMusicState } from "./util/parser";
import { repeatModes, Icons } from "./util/presets";
import { handleTaskEitherError } from "./util/utils";

interface QuickActionProps {
  track: Track;
  title: string;
  icon: Image.ImageLike;
  onAction?: () => void;
  action?: JSX.Element;
}

const QuickAction = (props: QuickActionProps) => {
  return (
    <List.Item
      title={props.title}
      icon={props.icon}
      detail={<TrackDetail track={props.track} />}
      actions={
        <ActionPanel>
          {props.action !== undefined ? (
            props.action
          ) : (
            <Action title={props.title} icon={props.icon} onAction={props.onAction} />
          )}
        </ActionPanel>
      }
    />
  );
};

export default function QuickActions() {
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

  return state?.playing === PlayerState.Stopped ? (
    <NoTrack />
  ) : (
    <List
      isLoading={isLoading}
      navigationTitle={state && `${state.name} - ${state.artist}`}
      isShowingDetail={state !== undefined}
    >
      {state && track && (
        <React.Fragment>
          <List.Section title={"Controls"}>
            <QuickAction
              track={track}
              title={`${state.playing === PlayerState.Playing ? "Pause" : "Play"} Track`}
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
            <QuickAction
              track={track}
              title={"Next Track"}
              icon={Icons.Next}
              onAction={pipe(
                music.player.next,
                TE.map(() => setRefresh(!refresh)),
                handleTaskEitherError
              )}
            />
            <QuickAction
              track={track}
              title={"Previous Track"}
              icon={Icons.Previous}
              onAction={pipe(
                music.player.previous,
                TE.map(() => setRefresh(!refresh)),
                handleTaskEitherError
              )}
            />
            <QuickAction
              track={track}
              title={"Restart Track"}
              icon={Icons.Restart}
              onAction={handleTaskEitherError(music.player.restart)}
            />
            <QuickAction
              track={track}
              title={"Toggle Shuffle"}
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
            <QuickAction
              track={track}
              title={"Set Repeat Mode"}
              icon={Icons.Repeat.Default}
              action={
                <ActionPanel.Submenu title={"Set Repeat Mode"} icon={Icons.Repeat.Default}>
                  {Object.entries(repeatModes).map(([key, mode]) => (
                    <Action
                      key={key}
                      title={`Set Repeat Mode to ${mode.title}`}
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
              }
            />
            <QuickAction
              track={track}
              title={"Set Volume"}
              icon={Icon.SpeakerOn}
              action={<Action.Push title={"Set Volume"} icon={Icon.SpeakerOn} target={<SetVolume />} />}
            />
          </List.Section>
          <List.Section title={"Track"}>
            {!state.inLibrary ? (
              <QuickAction
                track={track}
                title={"Add to Library"}
                icon={Icon.Plus}
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
              <QuickAction
                track={track}
                title={"Add to Playlist"}
                icon={Icon.Plus}
                action={<AddToPlaylistAction track={track} shortcut={{ modifiers: [], key: "enter" }} />}
              />
            )}
            <QuickAction
              track={track}
              title={state.favorited ? "Unfavorite Track" : "Favorite Track"}
              icon={state.favorited ? Icon.HeartDisabled : Icon.Heart}
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
            <QuickAction
              track={track}
              title={`${state.disliked ? "Undislike" : "Dislike"} Track`}
              icon={{ ...(state.disliked ? Icons.Dislike : Icons.DislikeFilled), tintColor: Color.PrimaryText }}
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
            {state.inLibrary && (
              <React.Fragment>
                <QuickAction
                  track={track}
                  title={"Set Rating"}
                  icon={Icons.Star}
                  action={
                    <ActionPanel.Submenu title={"Set Rating"} icon={Icons.Star}>
                      {Array.from({ length: 6 }, (_, i) => i).map((rating) => (
                        <Action
                          key={rating}
                          title={`Set Rating to ${rating}`}
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
                  }
                />
                <QuickAction
                  track={track}
                  title={"Delete from Library"}
                  icon={{ source: Icon.Trash }}
                  onAction={pipe(
                    music.player.deleteFromLibrary,
                    TE.map(() => showHUD("Deleted from Library")),
                    handleTaskEitherError
                  )}
                />
              </React.Fragment>
            )}
          </List.Section>
        </React.Fragment>
      )}
    </List>
  );
}
