import { pipe } from "fp-ts/lib/function";

import { refreshCache, wait } from "./util/cache";
import { handleTaskEitherError } from "./util/error-handling";
import * as music from "./util/scripts";
import * as TE from "./util/task-either";

export default async () => {
  await pipe(
    music.player.addToLibrary,
    handleTaskEitherError("Failed to Add to Library", "Added to library"),
    TE.map(async () => {
      await wait(5);
      await refreshCache();
    })
  )();
};
