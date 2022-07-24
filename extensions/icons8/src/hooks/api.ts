import { showToast, Toast, getPreferenceValues } from "@raycast/api";
import { Preferences, Icon8, Style } from "../types/types";
import { svgToImage, svgToMdImage, defaultStyles } from "../utils/utils";
import fetch from "node-fetch";

const preferences: Preferences = getPreferenceValues();

const api: string = preferences.apiKey;
const numResults: number = preferences.numResults;
export const numRecent: number = preferences.numRecent;

export const getIcons = async (search: string, style?: string): Promise<Icon8[]> => {
  let query = `https://search.icons8.com/api/iconsets/v5/search?term=${search}&token=${api}&amount=${numResults}`;
  if (style) {
    query += `&platform=${style}`;
  }
  try {
    const response = await fetch(query);
    if (response.status !== 200) {
      showToast(Toast.Style.Failure, `Error Fetching Icons. Reponse Status : ${response.status}`);
      console.log(response);
      return [];
    }
    const data: any = await response.json();
    const icons = data.icons;
    const icons8: Icon8[] = icons.map((icon: any) => ({
      id: icon.id,
      name: icon.name,
      url: `https://img.icons8.com/${icon.platform}/2x/${icon.commonName}.png`,
      link: `https://icons8.com/icon/${icon.id}/${icon.name}`,
      platform: icon.platform,
      isColor: icon.isColor,
    }));
    return icons8;
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const getStyles = async (): Promise<Style[]> => {
  const query = `https://api-icons.icons8.com/publicApi/platforms?token=${api}&limit=588`;
  try {
    const response = await fetch(query);
    const data: any = await response.json();
    if (response.status !== 200) {
      showToast(Toast.Style.Failure, `Error Fetching Styles. Reponse Status : ${response.status}`);
      console.log(data);
      return [];
    }
    const platforms = data.docs
      .filter((platform: any) => platform.title in defaultStyles)
      .filter((platform: any) => platform.iconsCount > 0)
      .sort((a: any, b: any) => a.title.localeCompare(b.title));
    const styles: Style[] = platforms.map((platform: any) => ({
      code: platform.apiCode,
      title: platform.title,
      count: platform.iconsCount,
      url: platform.preview,
    }));
    return styles;
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const getIconDetail = async (icon8: Icon8, color: string): Promise<Icon8 | undefined> => {
  const query = `https://api-icons.icons8.com/publicApi/icons/icon?id=${icon8.id}&token=${api}`;
  const response = await fetch(query);
  const data: any = await response.json();
  const icon = data.icon;
  try {
    icon8 = {
      id: icon.id,
      name: icon.name,
      url: `https://img.icons8.com/${icon.platform}/2x/${icon.commonName}.png`,
      link: `https://icons8.com/icon/${icon.id}/${icon.name}`,
      platform: icon.platform,
      isColor: icon8.isColor,
      svg: icon.svg,
      description: icon.description,
      style: icon.platformName,
      category: icon.categoryName,
      tags: icon.tags,
      isFree: icon.isFree,
      isAnimated: icon.isAnimated,
      published: new Date(icon.publishedAt),
    };
    icon8.image = await svgToImage(icon8.svg, icon8.isColor ? undefined : color);
    icon8.mdImage = svgToMdImage(icon8.image, 256, 256);
    return icon8;
  } catch (e: any) {
    console.error(e);
    return undefined;
  }
};
