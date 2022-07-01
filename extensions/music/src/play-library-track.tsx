import { showToast, Toast } from "@raycast/api";
import { useCallback, useState } from "react";
import { getMaxNumberOfResults } from "./util/listorgrid";
import { Tracks } from "./tracks";
import { Track } from "./util/models";
import { fromEmptyOrNullable } from "./util/option";
import { parseResult } from "./util/parser";
import * as music from "./util/scripts";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as S from "fp-ts/string";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

export default function PlayLibraryTrack() {
  const [tracks, setTracks] = useState<readonly Track[] | null>([]);
  const numResults = getMaxNumberOfResults();

  const onSearch = useCallback(
    async (next: string) => {
      if (!next) return;
      // start loading
      setTracks(null);

      await pipe(
        next,
        S.trim,
        music.track.search,
        TE.matchW(
          () => {
            showToast(Toast.Style.Failure, "Could not get tracks");
            return [] as ReadonlyArray<Track>;
          },
          (tracks) => {
            tracks = tracks.replace(/\s&\s/g, " and ");
            tracks = tracks.split("\n").slice(0, numResults).join("\n");
            return pipe(
              tracks,
              fromEmptyOrNullable,
              O.matchW(() => [] as ReadonlyArray<Track>, parseResult<Track>())
            );
          }
        ),
        T.map(setTracks)
      )();
    },
    [setTracks]
  );

  return <Tracks tracks={tracks} onSearch={onSearch} throttle={true} />;
}
