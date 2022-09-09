import { pipe, flow } from "fp-ts/lib/function";
import * as A from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";

import { runScript } from "../util/apple-script";
import { parseImageStream } from "../util/artwork";
import { getCachedPlaylists, setCachedPlaylists } from "../util/cache";
import { Playlist, Track } from "../util/models";
import { createQueryString, parsePlaylist, parseResults } from "../util/parser";
import { handleTaskEitherError } from "../util/utils";
import { parseStringsForAppleScript } from "../util/utils";

export const getPlaylists = async (useCache = true): Promise<readonly Playlist[]> => {
  if (useCache) {
    const playlistCache = getCachedPlaylists();
    if (playlistCache) return playlistCache;
  }
  const outputQuery = createQueryString({
    id: "persistent ID",
    name: "name as string",
    duration: "duration",
    count: "(count tracks)",
    time: "time",
    kind: "class of currentPlaylist as string",
  });
  let playlists: readonly Playlist[] = [];
  await pipe(
    runScript(`
      set output to ""
      tell application "Music"
        repeat with currentPlaylist in every playlist
          tell currentPlaylist to set output to output & ${outputQuery} & "\n"
        end repeat
      end tell
      return output
    `),
    TE.map(
      flow(
        parseResults<Playlist>(),
        A.map(parsePlaylist),
        A.filter((playlist) => !["Library", "Music"].includes(playlist.name)),
        (result) => (playlists = result)
      )
    ),
    handleTaskEitherError
  )();
  playlists = await Promise.all(
    playlists.map(async (playlist) => ({
      ...playlist,
      tracks: await getPlaylistTracks(playlist),
      artwork: await getPlaylistArtwork(playlist),
    }))
  );
  setCachedPlaylists(playlists);
  return playlists;
};

const getPlaylistArtwork = async (playlist: Playlist) => {
  let artwork: string | undefined;
  await pipe(
    runScript(`
      tell application "Music"
        set playlistArtwork to first artwork of first playlist of (every playlist whose persistent ID is "${playlist.id}")
        return data of playlistArtwork
      end tell
    `),
    TE.map((response) => (artwork = parseImageStream(response))),
    handleTaskEitherError
  )();
  return artwork;
};

export const getPlaylistTracks = async (playlist: Playlist): Promise<string[]> => {
  let tracks: string[] = [];
  await pipe(
    runScript(`
      set output to ""
      tell application "Music"
        set allTracks to tracks of first playlist of (every playlist whose persistent ID is "${playlist.id}")
        repeat with aTrack in allTracks
          tell aTrack to set output to output & persistent ID & "\n"
        end repeat
      end tell
      return output
    `),
    TE.map((response) => (tracks = response.split("\n"))),
    handleTaskEitherError
  )();
  return tracks;
};

export const addTrackToPlaylist = (playlist: Playlist, track: Track) => {
  const { name, album, artist } = parseStringsForAppleScript(track);
  return runScript(`
    tell application "Music"
      set matchingTrack to first track of playlist "Library" whose name is "${name}" and album is "${album}" and artist is "${artist}"
      duplicate matchingTrack to first playlist whose persistent ID is "${playlist.id}"
    end tell
  `);
};

export const removeFromPlaylist = (playlist: Playlist, track: Track) => {
  const { name, album, artist } = parseStringsForAppleScript(track);
  return runScript(`
    tell application "Music"
      set matchingPlaylist to first playlist whose persistent ID is "${playlist.id}"
      set matchingTrack to first track of matchingPlaylist whose name is "${name}" and album is "${album}" and artist is "${artist}"
      tell matchingPlaylist to delete matchingTrack
    end tell
  `);
};

export const play =
  (shuffle = false) =>
  (playlist: Playlist) =>
    runScript(`
      tell application "Music"
        set shuffle enabled to ${shuffle.toString()}
        set song repeat to all
        play first playlist whose persistent ID is "${playlist.id}"
      end tell
    `);

export const show = (playlist: Playlist) =>
  runScript(`
    tell application "Music" 
      reveal (every playlist whose persistent ID is "${playlist.id}")
      activate
    end tell
  `);
