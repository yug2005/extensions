import { useEffect, useState } from "react";

import { Tracks } from "./components/tracks";
import * as music from "./scripts";
import { Track } from "./util/models";

export default function PlayTrack() {
  const [tracks, setTracks] = useState<readonly Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    music.track
      .getAllTracks()
      .then(setTracks)
      .then(() => setIsLoading(false));
  }, []);

  return <Tracks tracks={tracks} isLoading={isLoading} />;
}
