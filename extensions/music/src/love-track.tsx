import { showHUD } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import * as music from "./util/scripts";

export default async () => {
  await pipe(
    music.player.love,
    TE.map(() => showHUD("Track Loved")),
    TE.mapLeft(() => showHUD("Failed to Love Track"))
  )();
};
