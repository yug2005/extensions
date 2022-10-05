import { showHUD } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";

import { handleTaskEitherError } from "./util/error-handling";
import * as music from "./util/scripts";

export default async () => {
  await pipe(
    music.player.love,
    handleTaskEitherError(
      () => showHUD("Failed to Love Track"),
      () => showHUD("Track Loved")
    )
  )();
};
