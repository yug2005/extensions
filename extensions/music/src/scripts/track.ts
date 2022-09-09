import * as A from "fp-ts/lib/Array";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { runScript, tellMusic } from "../util/apple-script";
import { parseImageStream, getTrackArtwork } from "../util/artwork";
import { getCachedTracks, setCachedTracks } from "../util/cache";
import { Track, Playlist } from "../util/models";
import { createQueryString, parseResult, parseResults, parseTrack } from "../util/parser";
import { handleTaskEitherError, parseStringsForAppleScript } from "../util/utils";

export const getAllTracks = async (useCache = true): Promise<readonly Track[]> => {
  if (useCache) {
    const cachedTracks = getCachedTracks();
    if (cachedTracks) return cachedTracks;
  }
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
  let tracks: readonly Track[] = [];
  await pipe(
    runScript(`
      set output to ""
      set inLibrary to true
      tell application "Music"
        set allTracks to every track
        repeat with aTrack in allTracks
          tell aTrack to set output to output & ${outputQuery} & "\n"
        end repeat
      end tell
      return output
    `),
    TE.map(flow(parseResults<Track>(), A.map(parseTrack), (result) => (tracks = result))),
    handleTaskEitherError
  )();
  tracks = await Promise.all(tracks.map(async (track) => ({ ...track, artwork: await getTrackArtwork(track) })));
  setCachedTracks(tracks);
  return tracks;
};

export const getCurrentTrackDetails = async (): Promise<Track> => {
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
  let track: Track = {} as Track;
  await pipe(
    runScript(`
      tell application "Music"
        if exists current track then
          set matchingTracks to (tracks of playlist "Library" whose name is name of current track as string and album is album of current track as string and artist is artist of current track as string)
          set inLibrary to (count of matchingTracks) > 0
          if inLibrary then
            set myTrack to beginning of matchingTracks
            tell myTrack to return ${outputQuery} & "\n"
          else 
            tell current track to return ${outputQuery} & "\n"
          end if
        end if
      end tell
    `),
    TE.map(flow(parseResult<Track>(), parseTrack, (result) => (track = result))),
    handleTaskEitherError
  )();
  return { ...track, artwork: await getCurrentTrackArtwork() };
};

export const getCurrentTrackArtwork = async (): Promise<string | undefined> => {
  let artwork: string | undefined = undefined;
  await pipe(
    runScript(`
      tell application "Music"
        if exists current track then
          return data of artworks of current track
        end if
      end tell
    `),
    TE.map(flow(parseImageStream, async (result) => (artwork = await result))),
    handleTaskEitherError
  )();
  return artwork;
};

export const play = (track: Track) => {
  const { name, album, artist } = parseStringsForAppleScript(track);
  return tellMusic(`play first track whose name is "${name}" and album is "${album}" and artist is "${artist}"`);
};

export const showTrack = (track: Track) => {
  const { name, album, artist } = parseStringsForAppleScript(track);
  return runScript(`
    tell application "Music" 
      reveal first track whose name is "${name}" and album is "${album}" and artist is "${artist}"
      activate
    end tell
  `);
};

export const playOnRepeat = (track: Track) => {
  const { name, album, artist } = parseStringsForAppleScript(track);
  return runScript(`
    tell application "Music" 
      set song repeat to one
      reveal first track whose name is "${name}" and album is "${album}" and artist is "${artist}"
      activate
      delay 0.1
      tell application "System Events" to key code 36
    end tell
  `);
};

export const playFromAlbum = (track: Track) => {
  const { name, album, artist } = parseStringsForAppleScript(track);
  return runScript(`
    tell application "Music" 
      reveal first track whose name is "${name}" and album is "${album}" and artist is "${artist}"
      activate
      delay 0.1
      tell application "System Events" to key code 36
    end tell
  `);
};

export const playFromPlaylist = (playlist: Playlist, onRepeat: boolean) => (track: Track) => {
  const { name, album, artist } = parseStringsForAppleScript(track);
  return runScript(`
    tell application "Music"
      set song repeat to ${onRepeat ? "one" : "all"}
      set matchingPlaylist to first playlist whose persistent id is "${playlist.id}"
      set matchingTrack to first track of matchingPlaylist whose name is "${name}" and album is "${album}" and artist is "${artist}"
      reveal matchingTrack
      activate
      delay 0.1
      tell application "System Events" to key code 36
    end tell
  `);
};
