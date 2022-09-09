import { Cache } from "@raycast/api";

import * as music from "../scripts";
import { Track, Playlist } from "./models";

const cache = new Cache({ capacity: 50000000 });

export enum ExpirationTime {
  Hour = 3600 * 1000,
  Day = 24 * Hour,
}

export const queryCache = (key: string, expirationTime = ExpirationTime.Day): any => {
  if (cache.has(key)) {
    const data = cache.get(key);
    if (data) {
      const { time, value }: { time: number; value: any } = JSON.parse(data);
      if (Date.now() - time < expirationTime) {
        return value;
      }
    }
  }
  return undefined;
};

export const setCache = (key: string, value: any): void => {
  cache.set(key, JSON.stringify({ time: Date.now(), value }));
};

export const getCachedTracks = (): readonly Track[] => queryCache("tracks");
export const setCachedTracks = (tracks: readonly Track[]) => setCache("tracks", tracks);

export const getCachedPlaylists = (): readonly Playlist[] => queryCache("playlists");
export const setCachedPlaylists = (playlists: readonly Playlist[]) => setCache("playlists", playlists);

export const refreshCache = async () => {
  await music.track.getAllTracks(false);
  await music.playlists.getPlaylists(false);
};
