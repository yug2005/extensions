import { pipe } from "fp-ts/lib/function";
import * as R from "fp-ts/Reader";
import * as RTE from "fp-ts/ReaderTaskEither";

import { runScript, tellMusic } from "../util/apple-script";

export const setShuffle: RTE.ReaderTaskEither<boolean, Error, string> = pipe(
  R.ask<boolean>(),
  R.map((shuffle) => tellMusic(`set shuffle enabled to ${shuffle.toString()}`))
);

export const shuffleLibrary = runScript(`
  tell application "Music"
    set shuffle enabled to true
    set song repeat to none
    play playlist "Library"
  end tell
`);
