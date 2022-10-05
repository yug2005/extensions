import { Cache } from "@raycast/api";
import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";

import { Playlist, Track } from "./models";
import * as music from "./scripts";

const cache = new Cache();

export enum ExpirationTime {
  Hour = 3600 * 1000,
  Day = 24 * Hour,
}

export const getCachedPlaylistTracks = (playlistId: string, expTime = ExpirationTime.Day): O.Option<Track[]> =>
  queryCache(playlistId, expTime);

export const getCachedTracks = (expTime = ExpirationTime.Day): O.Option<Track[]> => queryCache("tracks", expTime);
export const getCachedPlaylists = (expTime = ExpirationTime.Day): O.Option<Playlist[]> =>
  queryCache("playlists", expTime);

export const queryCache = <T>(key: string, expirationTime = ExpirationTime.Day): O.Option<T> => {
  const data = cache.get(key);
  if (!data) return O.none;

  const { time, value }: { time: number; value: unknown } = JSON.parse(data);

  if (Date.now() - time < expirationTime) {
    return O.some(value as T);
  }

  return O.none;
};

export const setCache = (key: string, value: unknown): void => {
  cache.set(key, JSON.stringify({ time: Date.now(), value }));
};

export const wait = async (seconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const refreshCache = async (): Promise<void> => {
  await music.track.getAllTracks(false)();
  await pipe(
    music.playlists.getPlaylists(false),
    TE.chain(
      flow(
        A.map((p) => music.playlists.getPlaylistTracks(p.id, false)),
        TE.sequenceArray
      )
    )
  )();
};
