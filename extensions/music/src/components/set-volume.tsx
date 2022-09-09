import { Action, ActionPanel, Form, showToast, Toast } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { useEffect, useState } from "react";

import * as music from "../scripts";
import { handleTaskEitherError } from "../util/utils";

export const SetVolume = () => {
  const [volume, setVolume] = useState<string>();

  useEffect(() => {
    pipe(music.player.getVolume, TE.map(setVolume), handleTaskEitherError)();
  }, []);

  return (
    <Form
      isLoading={volume === undefined}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={"Set Volume"} />
        </ActionPanel>
      }
    >
      {volume === undefined ? undefined : (
        <Form.Dropdown
          id={"volume"}
          title={"Volume"}
          defaultValue={volume.toString()}
          onChange={(v: string) => {
            if (v !== volume) {
              pipe(
                v,
                parseInt,
                music.player.setVolume,
                TE.map(() => showToast(Toast.Style.Success, `Volume set to ${v}`)),
                handleTaskEitherError
              )();
            }
          }}
        >
          {Array.from(Array(101).keys()).map((i) => (
            <Form.Dropdown.Item key={i} value={i.toString()} title={i.toString()} />
          ))}
        </Form.Dropdown>
      )}
    </Form>
  );
};
