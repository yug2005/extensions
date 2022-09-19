import { handleTaskEitherError } from "./util/error-handling";
import * as music from "./util/scripts";

export default async () => {
  await handleTaskEitherError()(music.player.previous)();
};
