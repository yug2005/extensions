import { showToast, showHUD, Toast, Clipboard, Cache, open, environment, LaunchType } from "@raycast/api";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import TimeFormat from "hh-mm-ss";

import { Track, Album } from "./models";

export const sortCache = new Cache();

interface ScriptError extends Error {
  shortMessage: string;
  command: string;
  failed: boolean;
}

const ScriptError = {
  is: (error: Error): error is ScriptError => "shortMessaage" in error,
};

export const handleError = (error: Error) =>
  TE.tryCatch(() => showToast(Toast.Style.Failure, error.name, error.message), E.toError);

export const handleTaskEitherError = <T, E extends Error>(te: TE.TaskEither<E, T>) =>
  pipe(
    te,
    TE.mapLeft((error) => {
      console.error(error);
      if (environment.launchType !== LaunchType.Background) {
        showToast({
          title: "Error",
          message: ScriptError.is(error) ? error.shortMessage : error.message,
          style: Toast.Style.Failure,
          primaryAction: {
            title: "Copy stack trace",
            onAction: () => Clipboard.copy(error.message),
            shortcut: {
              key: "enter",
              modifiers: ["shift"],
            },
          },
          secondaryAction: {
            title: "Report Issue",
            onAction: async () => {
              await open(
                "https://github.com/raycast/extensions/issues/new?assignees=&labels=extension%2C+bug&template=extension_bug_report.md&title=%5BMusic%5D"
              );
              showHUD(`Thanks for reporting this bug!`);
            },
            shortcut: {
              key: "enter",
              modifiers: ["cmd"],
            },
          },
        });
      }
    })
  );

export const titleCase = (text: string) => {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const trimTitle = (title: string) => {
  const MAX_TITLE_LENGTH = 25;
  if (title.length > MAX_TITLE_LENGTH) {
    title = `${title.substring(0, MAX_TITLE_LENGTH)}...`;
  }
  return title;
};

export const constructDate = (date: string): Date => {
  return new Date(date.replaceAll(",", "").replaceAll("at", ""));
};

export const formatDate = (date: number): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDuration = (duration: number): string => {
  return TimeFormat.fromS(Math.floor(duration));
};

export const parseStringsForAppleScript = <T extends object>(object: T): T => {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      typeof value === "string" ? value.replaceAll(`"`, `\\"`) : value,
    ])
  ) as T;
};

export const getAlbums = (tracks: readonly Track[]): Album[] => {
  const albums: Album[] = [];
  tracks.forEach((track) => {
    const id = `${track.album}-${track.albumArtist}`;
    const album = albums.find((a) => a.id === id);
    if (album) {
      album.tracks.push(track);
      album.playedCount += track.playedCount;
      album.dateAdded = Math.max(album.dateAdded, track.dateAdded);
      album.duration += track.duration;
    } else {
      albums.push({
        id: id,
        name: track.album,
        artist: track.albumArtist,
        artwork: track.artwork,
        genre: track.genre,
        playedCount: track.playedCount,
        dateAdded: track.dateAdded,
        duration: track.duration,
        year: track.year,
        tracks: [track],
      });
    }
  });
  return albums;
};
