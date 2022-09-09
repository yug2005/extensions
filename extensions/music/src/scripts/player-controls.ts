import { runScript, tellMusic } from "../util/apple-script";
import { Playlist } from "../util/models";
import { createQueryString } from "../util/parser";

export const activate = tellMusic("activate");
export const pause = tellMusic("pause");
export const play = tellMusic("play");
export const stop = tellMusic("stop");
export const next = tellMusic("next track");
export const previous = tellMusic("previous track");
export const restart = tellMusic("back track");
export const togglePlay = tellMusic("playpause");
export const favorite = tellMusic("set favorited of current track to true");
export const dislike = tellMusic("set disliked of current track to true");
export const toggleFavorite = tellMusic("set favorited of current track to not favorited of current track");
export const toggleDislike = tellMusic("set disliked of current track to not disliked of current track");
export const addToLibrary = tellMusic(`duplicate current track to source "Library"`);
export const getVolume = tellMusic("get sound volume");
export const getPlaying = tellMusic("get player state");
export const toggleShuffle = tellMusic(`set shuffle enabled to not shuffle enabled`);
export const setShuffle = (shuffle: boolean) => tellMusic(`set shuffle enabled to ${shuffle}`);
export const setRepeatMode = (mode: string) => tellMusic(`set song repeat to ${mode}`);
export const setVolume = (volume: number) => tellMusic(`set sound volume to ${volume}`);

export const showTrack = runScript(`
  tell application "Music"
    reveal current track
    activate
  end tell
`);

export const setRating = (rating: number) =>
  runScript(`
    tell application "Music" 
      set matchingTrack to first track of (tracks of playlist "Library" whose name is name of current track as string and album is album of current track as string and artist is artist of current track as string)
      set rating of matchingTrack to ${rating}
    end tell
  `);

export const addToPlaylist = (playlist: Playlist) =>
  runScript(`
    tell application "Music"
      set matchingTrack to first track of playlist "Library" whose name is name of current track as string and album is album of current track as string and artist is artist of current track as string
      duplicate matchingTrack to first playlist whose persistent ID is "${playlist.id}"
    end tell
  `);

export const deleteFromLibrary = runScript(`
  tell application "Music"
    reveal first track of (tracks of playlist "Library" whose name is name of current track as string and album is album of current track as string and artist is artist of current track as string)
    activate
    stop
    tell application "System Events"
      key code 51
      key code 36
      key code 48
      key code 126
    end tell
  end tell
`);

export const getMusicState = runScript(`
  tell application "System Events" to set isRunning to (count of (every process whose name is "Music")) > 0
  if not isRunning then tell application "Music" to launch
  tell application "Music"
    if player state is not stopped and exists current track then
      set matchingTracks to (tracks of playlist "Library" whose name is name of current track as string and album is album of current track as string and artist is artist of current track as string)
      set inLibrary to (count of matchingTracks) > 0
      return ${createQueryString({
        name: "name of current track",
        artist: "artist of current track",
        playing: "player state",
        repeat: "song repeat",
        shuffle: "shuffle enabled",
        favorited: "favorited of current track",
        disliked: "disliked of current track",
        inLibrary: "inLibrary",
        rating: "rating of current track",
      })} & "\n"
    else
      return ${createQueryString({
        playing: "player state",
        repeat: "song repeat",
        shuffle: "shuffle enabled",
      })} & "\n"
    end if
  end tell
`);
