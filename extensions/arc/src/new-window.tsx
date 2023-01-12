import { showHUD, closeMainWindow } from "@raycast/api";
import { createNewArcWindow } from "./utils/utils";

export default async function Command() {
  try {
    await createNewArcWindow();
    await closeMainWindow();
  } catch {
    await showHUD("Could Not Create a New Arc Window");
  }
}
