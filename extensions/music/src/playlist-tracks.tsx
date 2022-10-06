import { pipe } from "fp-ts/lib/function";
import { PathReporter } from "io-ts/PathReporter";
import { useEffect, useState } from "react";

import { Tracks } from "./tracks";
import { playlistLayout } from "./util/list-or-grid";
import { Track } from "./util/models";
import * as music from "./util/scripts";
import * as TE from "./util/task-either";

export const PlaylistTracks = (props: { id: string }) => {
  const [tracks, setTracks] = useState<readonly Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getTracks = async () => {
      const result = await pipe(
        music.playlists.getPlaylistTracks(props.id),
        TE.tap((tracks) => setTracks(tracks as Track[]))
      )();

      if (result._tag === "Left") {
        if (result.left instanceof Error) {
          console.error(result.left);
        } else {
          console.error(PathReporter.report(result.left as any));
        }

        setIsLoading(false);
        return;
      }

      setTracks(result.right);
      setIsLoading(false);
    };

    getTracks();

    return () => {
      setTracks([]);
    };
  }, []);

  return <Tracks tracks={tracks as Track[]} isLoading={isLoading} overrideLayout={playlistLayout} dropdown={true} />;
};
