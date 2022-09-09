import * as A from "fp-ts/lib/Array";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { runScript } from "../util/apple-script";
import { Album, Track } from "../util/models";
import { createQueryString, parseResults, parseTrack } from "../util/parser";
import { handleTaskEitherError, parseStringsForAppleScript } from "../util/utils";

export const show = (album: Album) => {
  const { name, artist } = parseStringsForAppleScript(album);
  return runScript(`
		tell application "Music" 
			reveal first track of playlist 1 whose album is "${name}" and artist is "${artist}"
			activate
		end tell
  `);
};

export const play = (shuffle: boolean) => (album: Album) => {
  const { name, artist } = parseStringsForAppleScript(album);
  return runScript(`
		tell application "Music" 
			set song repeat to all
			${shuffle ? "set shuffle enabled to true" : ""}
			reveal first track of playlist 1 whose album is "${name}" and artist is "${artist}"
			activate
			tell application "System Events" to key code 36
		end tell
  `);
};

export const playByName = (name: string, artist: string, shuffle: boolean) => {
  const parsed = parseStringsForAppleScript({ name, artist });
  return runScript(`
		tell application "Music" 
			set song repeat to all
			${shuffle ? "set shuffle enabled to true" : ""}
			reveal first track of playlist 1 whose album is "${parsed.name}" and artist is "${parsed.name}"
			activate
			tell application "System Events" to key code 36
		end tell
  `);
};

export const getAlbumOfTrack = async (track: Track): Promise<Album> => {
  const outputQuery = createQueryString({
    id: "persistent ID",
    name: "name",
    artist: "artist",
    album: "album",
    albumArtist: "album artist",
    genre: "genre",
    dateAdded: "date added",
    playedCount: "played count",
    duration: "duration",
    time: "time",
    year: "year",
    inLibrary: "inLibrary",
    favorited: "favorited",
    disliked: "disliked",
    rating: "rating",
  });
  let tracks: Track[] = [];
  await pipe(
    runScript(`
      set output to ""
      set inLibrary to true
      tell application "Music"
        set allTracks to (every track whose album is "${track.album}" and album artist is "${track.albumArtist}")
        repeat with aTrack in allTracks
          tell aTrack to set output to output & ${outputQuery} & "\n"
        end repeat
      end tell
      return output
    `),
    TE.map(flow(parseResults<Track>(), A.map(parseTrack), (result) => (tracks = result))),
    handleTaskEitherError
  )();
  const album: Album = {
    id: `${track.album}-${track.albumArtist}`,
    name: track.album,
    artist: track.albumArtist,
    artwork: track.artwork,
    genre: track.genre,
    playedCount: tracks.reduce((a, c) => a + c.playedCount, 0),
    dateAdded: tracks.reduce((a, c) => Math.min(a, c.dateAdded), 0),
    duration: tracks.reduce((a, c) => a + c.duration, 0),
    year: track.year,
    tracks: tracks.map((t) => ({ ...t, artwork: track.artwork })),
  };
  return album;
};
