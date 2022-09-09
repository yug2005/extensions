import * as music from "./scripts";
import { handleTaskEitherError } from "./util/utils";

export default async () => {
  handleTaskEitherError(music.general.shuffleLibrary)();
};
