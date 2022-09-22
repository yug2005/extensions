import { Clipboard, open, showHUD, showToast, Toast } from "@raycast/api";
import { pipe } from "fp-ts/function";

import * as TE from "./task-either";
import { isMenuBar } from "./utils";

type VoidFn<T> = (arg: T) => void;

export interface ScriptError extends Error {
  shortMessage: string;
  command: string;
  failed: boolean;
}

export const ScriptError = {
  is: (error: Error): error is ScriptError => "shortMessage" in error,
};

export function displayError(error: Error | ScriptError) {
  const message = ScriptError.is(error) ? error.shortMessage : error.message;

  if (isMenuBar()) {
    showHUD(`Error: ${message}`);
    return;
  }

  showToast({
    title: "Error",
    message,
    style: Toast.Style.Failure,
    primaryAction: {
      title: "Copy stack trace",
      onAction: () => Clipboard.copy(error.stack ?? error.message),
      shortcut: {
        key: "enter",
        modifiers: ["shift"],
      },
    },
    secondaryAction: {
      title: "Report Issue",
      onAction: async () => {
        await open(
          "https://github.com/raycast/extensions/issues/new?assignees=&labels=extension%2C+bug&template=extension_bug_report.md&title=%5BMusic%5D"
        );

        await showHUD(`Thanks for reporting this bug!`);
      },
      shortcut: {
        key: "enter",
        modifiers: ["cmd"],
      },
    },
  });
}

// Function overload to accept multiple params types.
function handleTaskEitherError<E extends Error, T>(
  onError?: VoidFn<E>,
  onSuccess?: VoidFn<T>
): (te: TE.TaskEither<E, T>) => TE.TaskEither<void, T>;
/**
 *
 * @param errorMessage Used only in menu-bar {String}
 * @param successMessage Argument for `showHUD` {String}
 */
function handleTaskEitherError<E extends Error, T>(
  errorMessage?: string,
  successMessage?: string
): (te: TE.TaskEither<E, T>) => TE.TaskEither<void, T>;
function handleTaskEitherError<E extends Error, T>(error?: string | VoidFn<E>, success?: string | VoidFn<T>) {
  const onSuccess = typeof success === "string" ? () => showHUD(success) : success;
  const onError = typeof error === "string" ? () => undefined : error;

  return (te: TE.TaskEither<E, T>) =>
    pipe(te, TE.tap(onSuccess), TE.tapLeft(onError), TE.tapLeft(console.error), TE.mapLeft(displayError));
}

export { handleTaskEitherError };
