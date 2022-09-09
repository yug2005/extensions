import { flow, pipe } from "fp-ts/function";
import * as A from "fp-ts/ReadonlyArray";
import * as S from "fp-ts/string";

import { Track, Playlist, MusicState, PlayerState } from "./models";
import { constructDate } from "./utils";

const BREAK = "<BR>";
const EQUAL = "<EQ>";

/**
 * Transforms an object to a querystring concatened in apple-script.
 * @example
 *  createQueryString({
 *     id: 'trackId',
 *     name: 'trackName',
 *  }) // => "id<EQ>" & trackId & "<BR>name<EQ>" & trackName"
 */
export const createQueryString = <T extends object>(obj: T): string => {
  return Object.entries(obj).reduce((acc, [key, value], i) => {
    const keyvalue = `"${i > 0 ? BREAK : ""}${key}${EQUAL}" & ${value}`;
    return acc ? `${acc} & ${keyvalue}` : keyvalue;
  }, "");
};

const parseQueryString =
  <T = any>() =>
  (querystring: string): T => {
    const object: { [key: string]: string } = {};
    querystring.split(BREAK).forEach((keyvalue: string) => {
      const [key, value] = keyvalue.split(EQUAL);
      object[key] = value;
    });
    return object as unknown as T;
  };

export const parseResult =
  <T extends object>() =>
  (raw: string): T =>
    pipe(raw, S.trim, parseQueryString<T>()) as T;

export const parseResults =
  <T extends object>() =>
  (raw: string): T[] =>
    pipe(raw, S.trim, S.split("\n"), A.map(flow(S.trim, parseQueryString<T>()))) as T[];

export const parseTrack = (track: Track): Track => ({
  ...track,
  dateAdded: constructDate(String(track.dateAdded)).getTime(),
  playedCount: Number(track.playedCount),
  duration: Number(track.duration),
  inLibrary: track.inLibrary.toString() === "true",
  favorited: track.favorited.toString() === "true",
  disliked: track.disliked.toString() === "true",
  rating: Number(track.rating) / 20,
});

export const parsePlaylist = (playlist: Playlist): Playlist => ({
  ...playlist,
  count: Number(playlist.count),
});

export const parseMusicState = (musicState: MusicState): MusicState => ({
  ...musicState,
  playing: musicState.playing as PlayerState,
  shuffle: musicState.shuffle.toString() === "true",
  inLibrary: musicState.inLibrary?.toString() === "true",
  favorited: musicState.favorited?.toString() === "true",
  disliked: musicState.disliked?.toString() === "true",
  rating: Number(musicState.rating) / 20,
});
