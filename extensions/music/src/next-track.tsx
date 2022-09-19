import { pipe } from "fp-ts/lib/function";

import { handleTaskEitherError } from "./util/error-handling";
import * as music from "./util/scripts";

export default async () => {
  await pipe(music.player.next, handleTaskEitherError())();
};
