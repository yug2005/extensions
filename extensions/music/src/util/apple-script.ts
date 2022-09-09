import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { runAppleScript } from "run-applescript";

import { logScript } from "./logger";

export const runScript = (command: string) => TE.tryCatch(() => pipe(command, logScript, runAppleScript), E.toError);
export const tellMusic = (command: string) => runScript(`tell application "Music" to ${command}`);
