import { useEffect, useState } from "react";

import * as music from "../scripts";
import { playlistTracksLayout } from "../util/list-or-grid";
import { Playlist, Track } from "../util/models";
import { Tracks } from "./tracks";

export const PlaylistTracks = ({ playlist }: { playlist: Playlist }) => {
  const [tracks, setTracks] = useState<readonly Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    music.track.getAllTracks().then((tracks) => {
      setTracks(tracks.filter((track: Track) => playlist.tracks.includes(track.id)));
      setIsLoading(false);
    });
  }, []);

  return <Tracks tracks={tracks} isLoading={isLoading} overrideLayout={playlistTracksLayout} playlist={playlist} />;
};
