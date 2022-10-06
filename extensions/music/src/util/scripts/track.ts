import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/ReadonlyArray";
import * as S from "fp-ts/string";
import * as T from "fp-ts/Task";
import { runAppleScript } from "run-applescript";

import { createQueryString, runScript, tellMusic } from "../apple-script";
import { removeLast } from "../array-utils";
import { parseImageStream, getAlbumArtwork } from "../artwork";
import { getCachedTracks, setCache } from "../cache";
import { Track } from "../models";
import * as TE from "../task-either";
import { constructDate, getAttribute } from "../utils";
import { sortByName } from "./sort";

export const getAllTracks = (useCache = true) => {
  if (useCache) {
    const cachedTracks = getCachedTracks();

    if (O.isSome(cachedTracks)) {
      return TE.right(cachedTracks.value);
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
      set allTracks to every track
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
    // TE.chainTaskK(flow(A.map(addTrackArtwork), T.sequenceArray)), // think of this like Promise.all but in parallel.
    TE.tap((tracks) => setCache("tracks", tracks))
  );
};

export const play = (track: Track) =>
  tellMusic(
    `play (every track whose name is "${track.name}" and album is "${track.album}" and artist is "${track.artist}")`
  );

export const revealTrack = (track: Track) =>
  runScript(`tell application "Music"
    reveal (every track whose name is "${track.name}" and album is "${track.album}" and artist is "${track.artist}")
    activate
  end tell`);

export const playOnRepeat = (track: Track) =>
  runScript(`
  tell application "System Events"
    set activeApp to name of first application process whose frontmost is true
  end tell
  tell application "Music"
    set song repeat to one
    reveal (every track whose name is "${track.name}" and album is "${track.album}" and artist is "${track.artist}")
    activate
    tell application "System Events" to key code 36
  end tell
  tell application activeApp to activate
  `);

export const addTrackArtwork = (track: Track): T.Task<Track> => {
  return pipe(
    track,
    getTrackArtwork,
    T.map((artwork) => ({ ...track, artwork }))
  );
};

export const getTrackArtwork = (track: Track) => {
  const default_artwork = "../assets/no-track.png";

  return pipe(
    getAlbumArtwork(track.albumArtist || track.artist, track.album || track.name),
    TE.orElse(() =>
      (track.album || track.name).includes(" - Single")
        ? getAlbumArtwork(track.albumArtist || track.artist, (track.album || track.name).replace(" - Single", ""))
        : TE.right(default_artwork)
    ),
    TE.map(
      flow(
        O.fromNullable,
        O.getOrElse(() => default_artwork)
      )
    ),
    TE.getOrElse(() => T.of(default_artwork))
  );
};

export const getTrackDetails = async (track: Track): Promise<Track> => {
  const outputQuery = createQueryString({
    time: "time",
    loved: "loved",
    year: "year",
    rating: "rating",
  });

  const response = await runAppleScript(`
    set output to ""
    tell application "Music"
      set myTrack to first track of (every track whose database ID is "${track.id}")
      tell myTrack to set output to output & ${outputQuery} & "\n"
    end tell
    return output
  `);

  return {
    ...track,
    time: getAttribute(response, "time"),
    loved: getAttribute(response, "loved") === "true",
    year: getAttribute(response, "year"),
    rating: parseInt(getAttribute(response, "rating")) / 20,
  };
};

export const getCurrentTrackArtwork = async (size?: number) => {
  const response = await runAppleScript(`tell application "Music" to get data of artworks of current track`);
  return parseImageStream(response, size ? { width: size, height: size } : undefined);
};

export const getCurrentTrackDetails = async (): Promise<Track> => {
  const outputQuery = createQueryString({
    id: "database ID",
    name: "name",
    artist: "artist",
    album: "album",
    albumArtist: "album artist",
    genre: "genre",
    duration: "duration",
    time: "time",
    playedCount: "played count",
    inLibrary: "inLibrary",
    rating: "rating",
    loved: "loved",
    dateAdded: "date added",
    year: "year",
  });

  const matchingTracks = `(tracks of playlist "Library" whose name is name of current track as string and album is album of current track as string and artist is artist of current track as string)`;

  const response = await runAppleScript(`
    set output to ""
    tell application "Music"
      set matchingTracks to ${matchingTracks}
      set inLibrary to (count of matchingTracks) > 0
      if inLibrary then
        set myTrack to first track of ${matchingTracks}
        tell myTrack to set output to output & ${outputQuery} & "\n"
      else
        tell current track to set output to output & ${outputQuery} & "\n"
      end if
    end tell
    return output
  `);

  const track: Track = {
    id: getAttribute(response, "id"),
    name: getAttribute(response, "name"),
    artist: getAttribute(response, "artist"),
    album: getAttribute(response, "album"),
    albumArtist: getAttribute(response, "albumArtist"),
    genre: getAttribute(response, "genre"),
    duration: parseFloat(getAttribute(response, "duration")),
    time: getAttribute(response, "time"),
    playedCount: parseInt(getAttribute(response, "playedCount")),
    inLibrary: getAttribute(response, "inLibrary") === "true",
    rating: parseInt(getAttribute(response, "rating")) / 20,
    loved: getAttribute(response, "loved") === "true",
    dateAdded: constructDate(getAttribute(response, "dateAdded")).getTime(),
    year: getAttribute(response, "year"),
  };

  const artwork = await getCurrentTrackArtwork();
  return { ...track, artwork };
};
