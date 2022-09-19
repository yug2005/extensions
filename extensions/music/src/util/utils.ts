import { environment } from "@raycast/api";

export const displayDuration = (duration: number) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  return `${hours > 1 ? `${hours} hours ` : hours == 1 ? "1 hour " : ""}${minutes} min`;
};

export const getAttribute = (data: string, key: string) => {
  return data.includes(`${key}=`) ? data.split(`${key}=`)[1].split("$break")[0].replace("\n", "") : "";
};

const MAX_TITLE_LENGTH = 30;
export const trimTitle = (title: string) => {
  if (title.length > MAX_TITLE_LENGTH) {
    title = `${title.substring(0, MAX_TITLE_LENGTH - 3)}...`;
  } else {
    title = title.padEnd(MAX_TITLE_LENGTH);
  }
  return title;
};

export const constructDate = (date: string): Date => {
  return new Date(date.replaceAll(",", "").replaceAll("at", ""));
};

export const isMenuBar = () => environment.commandMode == "menu-bar";
