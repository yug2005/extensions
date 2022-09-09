import { getPreferenceValues } from "@raycast/api";
import fetch from "node-fetch";

import { queryCache, setCache } from "./cache";
import { Track, Preferences } from "./models";

const { apiKey }: Preferences = getPreferenceValues();

enum ImageType {
  NONE = "",
  JPEG = "JPEG",
  PNG = "tdta",
}

export const parseImageStream = (data: string) => {
  const imageType = data.slice(6, 10) as ImageType;
  if (imageType === ImageType.NONE) {
    console.warn("Unsupported image type: ", imageType as string);
    return undefined;
  }
  const binary = data.slice(10, -1);
  const image = Buffer.from(binary, "hex");
  if (image.length > 1e6) {
    console.warn(`Image size (${image.length}) is too large`);
    return undefined;
  }
  const bufferType = imageType === ImageType.JPEG ? "image/jpeg" : "image/png";
  return `data:${bufferType};base64,${image.toString("base64")}`;
};

const artworkQuery = (track: Track) => {
  const album = encodeURIComponent(track.album);
  const artist = encodeURIComponent(track.albumArtist);
  return `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${artist}&album=${album}&api_key=${apiKey}&format=json`;
};

export const getTrackArtwork = async (track: Track): Promise<string | undefined> => {
  const id = `${track.album}-${track.albumArtist}`;
  const cachedArtwork = queryCache(id);
  if (cachedArtwork) {
    return cachedArtwork;
  }
  try {
    const response = await fetch(artworkQuery(track));
    if (response.status === 200) {
      const data: any = await response.json();
      if ("album" in data && "image" in data.album && data.album.image?.length > 0) {
        const images = data.album.image;
        const artwork = images[images.length - 1]["#text"];
        if (artwork) {
          setCache(id, artwork);
          return artwork;
        }
      }
    }
    if (track.album.includes(" - Single")) {
      return await getTrackArtwork({ ...track, album: track.album.replace(" - Single", "") });
    }
  } catch (error) {
    console.error(error);
  }
  return undefined;
};
