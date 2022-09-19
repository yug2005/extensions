import { URLSearchParams } from "url";

import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { runAppleScript } from "run-applescript";

import { logScript } from "./logger";

export const runScript = (command: string) => TE.tryCatch(() => pipe(command, logScript, runAppleScript), E.toError);
export const tell = (application: string, command: string) =>
  runScript(`tell application "${application}" to ${command}`);
export const tellMusic = (command: string) => tell("Music", command);

/**
 * Transforms an object to a querystring concatened in apple-script.
 * @example
 *  objectToString({
 *     id: 'trackId',
 *     name: 'trackName',
 *  }) // => "id=" & trackId & "$breakname=" & trackName"
 */
export const createQueryString = <T extends object>(obj: T): string => {
  return Object.entries(obj).reduce((acc, [key, value], i) => {
    const keyvalue = `"${i > 0 ? "$break" : ""}${key}=" & ${value}`;

    if (!acc) return keyvalue;

    return `${acc} & ${keyvalue}`;
  }, "");
};

// prettier-ignore
export const parseQueryString = <T = any>() =>(querystring: string): T => Object.fromEntries(new URLSearchParams(querystring)) as unknown as T

const p =
  <T>() =>
  (queryString: string): T =>
    Object.fromEntries(queryString.split("$break").map((s) => s.split("="))) as unknown as T;
