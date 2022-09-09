import { closeMainWindow } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import * as music from "./scripts";
import { handleTaskEitherError } from "./util/utils";

export default async function SearchAppleMusic(props: { arguments: { searchTerm: string } }) {
  await pipe(
    music.search.searchAppleMusic(props.arguments.searchTerm),
    TE.map(() => closeMainWindow()),
    handleTaskEitherError
  )();
}
