import { pipe } from "fp-ts/lib/function";
import { useEffect, useState } from "react";

import { Tracks } from "./tracks";
import { handleTaskEitherError } from "./util/error-handling";
import { Track } from "./util/models";
import * as music from "./util/scripts";
import * as TE from "./util/task-either";

export default function PlayTrack() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    pipe(
      music.track.getAllTracks(),
      TE.tap((tracks) => setTracks(tracks as Track[])),
      TE.tap(() => setIsLoading(false)),
      TE.tapLeft(() => setTracks([])),
      handleTaskEitherError()
    )();
  }, []);

  return <Tracks tracks={tracks} isLoading={isLoading} dropdown={true} />;
}
