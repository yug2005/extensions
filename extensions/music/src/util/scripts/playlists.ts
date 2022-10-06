import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/ReadonlyArray";
import * as S from "fp-ts/string";
import * as T from "fp-ts/Task";
import { Errors } from "io-ts";
import { runAppleScript } from "run-applescript";

import { tell, runScript, createQueryString } from "../apple-script";
import { removeLast } from "../array-utils";
import { parseImageStream } from "../artwork";
import { getCachedPlaylists, getCachedPlaylistTracks, setCache } from "../cache";
import { Track, Playlist, PlaylistKind } from "../models";
import * as TE from "../task-either";
import { constructDate, getAttribute } from "../utils";
import { sortByName } from "./sort";
import { addTrackArtwork } from "./track";

import { general } from ".";

export const getPlaylists = (useCache = true): TE.TaskEither<Error | Errors, readonly Playlist[]> => {
  if (useCache) {
    const playlistCache = getCachedPlaylists();

    if (O.isSome(playlistCache)) {
      return TE.right(playlistCache.value);
    }
  }

  const outputQuery = createQueryString({
    id: "id",
    name: "name",
    duration: "duration",
    time: "time",
    count: "count tracks",
    description: "description",
  });

  const script = `
      set output to ""
      tell application "Music"
        set allPlaylists to every playlist
        repeat with aPlaylist in allPlaylists
          tell aPlaylist to set output to output & ${outputQuery} 
          set output to output & "$breakkind=" & class of aPlaylist & "\n" 
        end repeat
      end tell
      return output
    `;

  return pipe(
    runScript(script),
    TE.tapLeft(console.error),
    TE.map(
      flow(
        S.split("\n"),
        removeLast,
        A.map((line) => ({
          id: getAttribute(line, "id"),
          name: getAttribute(line, "name"),
          duration: getAttribute(line, "duration"),
          count: getAttribute(line, "count"),
          time: getAttribute(line, "time"),
          description: getAttribute(line, "description"),
          kind: getAttribute(line, "kind") as PlaylistKind,
        })),
        A.filter((p) => p.name !== "Library" && p.name !== "Music"),
        A.sortBy([sortByName])
      )
    ),
    TE.getOrElse(() => T.of<readonly Playlist[]>([])),
    TE.fromTask,
    TE.chain(flow(A.map(addPlaylistArtwork), TE.sequenceArray)),
    TE.tap((playlists) => setCache("playlists", playlists))
  );
};

export const addPlaylistArtwork = (playlist: Playlist): TE.TaskEither<Error | Errors, Playlist> =>
  pipe(
    TE.tryCatch(() => getPlaylistArtwork(playlist.id, 300), E.toError),
    TE.map((artwork) => ({ ...playlist, artwork }))
  );

export const getPlaylistArtwork = async (id: string, size?: number): Promise<string> => {
  const data = await runAppleScript(`
    tell application "Music"
      set playlistArtwork to first artwork of first playlist of (every playlist whose id is ${id})
      set playlistImage to data of playlistArtwork
    end tell
    return playlistImage
  `);

  return await parseImageStream(data, size ? { width: size, height: size } : undefined);
};

export const getPlaylistTracks = (id: string, useCache = true) => {
  if (useCache) {
    const cachedTracks = getCachedPlaylistTracks(id);
    if (O.isSome(cachedTracks)) {
      return TE.of(cachedTracks.value);
    }
  }

  const outputQuery = createQueryString({
    id: "database ID",
    name: "name",
    artist: "artist",
    album: "album",
    albumArtist: "album artist",
    genre: "genre",
    dateAdded: "date added",
    playedCount: "played count",
    duration: "duration",
  });

  const script = `
		set output to ""
			tell application "Music"
				set allTracks to tracks of first playlist of (every playlist whose id is ${id})
				repeat with aTrack in allTracks
          tell aTrack to set output to output & ${outputQuery} & "\n"
				end repeat
			end tell
		return output
	`;

  return pipe(
    runScript(script),
    TE.tapLeft(console.error),
    TE.map(
      flow(
        S.split("\n"),
        removeLast,
        A.map(
          (line): Track => ({
            id: getAttribute(line, "id"),
            name: getAttribute(line, "name"),
            artist: getAttribute(line, "artist"),
            album: getAttribute(line, "album"),
            albumArtist: getAttribute(line, "albumArtist"),
            genre: getAttribute(line, "genre"),
            dateAdded: constructDate(getAttribute(line, "dateAdded")).getTime(),
            playedCount: parseInt(getAttribute(line, "playedCount")),
            duration: parseFloat(getAttribute(line, "duration")) ?? 0,
          })
        ),
        A.sortBy([sortByName])
      )
    ),
    TE.getOrElse(() => T.of<readonly Track[]>([])),
    TE.fromTask,
    TE.chainTaskK(flow(A.map(addTrackArtwork), T.sequenceArray)),
    TE.tap((tracks) => setCache(id, tracks))
  );
};

export const play =
  (shuffle = false) =>
  (name: string): TE.TaskEither<Error, string> =>
    pipe(
      general.setShuffle(shuffle),
      TE.chain(() => tell("Music", `play playlist "${name.trim()}"`))
    );

export const playById =
  (shuffle = false) =>
  (id: string) =>
    pipe(
      general.setShuffle(shuffle),
      TE.chain(() => tell("Music", `play (every playlist whose id is "${id}")`))
    );

export const showPlaylist = (id: string) =>
  runScript(`tell application "Music" 
    reveal (every playlist whose id is "${id}")
    activate
  end tell`);
