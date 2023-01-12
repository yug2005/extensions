import { showHUD, closeMainWindow } from "@raycast/api";
import { viewArchive } from "./utils/utils";

export default async function Command() {
  try {
    await viewArchive();
    await closeMainWindow();
  } catch {
    await showHUD("Could Not Open Archive");
  }
}
