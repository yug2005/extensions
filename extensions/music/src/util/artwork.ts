import { Cache, getPreferenceValues } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import { Track } from "./models";
import resizeImg from "resize-image-buffer";
import fetch from "node-fetch";

const preferences = getPreferenceValues();
const api = preferences.apiKey;

export type Size = {
  width: number;
  height: number;
};

enum ImageType {
  NONE = "",
  JPEG = "JPEG",
  PNG = "tdta",
}

const imageTypeFromString = (imageType: string): ImageType => {
  return imageType === "JPEG" ? ImageType.JPEG : imageType === "tdta" ? ImageType.PNG : ImageType.NONE;
};

export const parseImageStream = async (data: string, size?: Size): Promise<string> => {
  const imageType = imageTypeFromString(data.slice(6, 10));
  if (imageType === ImageType.NONE) {
    console.warn("Unsupported Image Type: " + imageType);
    return "";
  }
  try {
    const binary = data.split(imageType)[1].slice(0, -1);
    let image = Buffer.from(binary, "hex");
    if (image.length > 1e6) {
      console.warn("Image is too large");
      return "";
    }
    if (size) {
      image = await resizeImg(image, size);
    }
    const bufferType = imageType === ImageType.JPEG ? "image/jpeg" : "image/png";
    return `data:${bufferType};base64,${image.toString("base64")}`;
  } catch (error) {
    console.error(error);
    return "";
  }
};

export const getCurrentTrackArtwork = async (size?: number) => {
  const response = await runAppleScript(`tell application "Music" to get data of artworks of current track`);
  return parseImageStream(response, size ? { width: size, height: size } : undefined);
};

const artworks = new Cache();

export const getAlbumArtwork = async (artist: string, album: string): Promise<string | undefined> => {
  const key = `${artist}-${album}`;
  if (artworks.has(key)) {
    return artworks.get(key);
  }
  const query = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(
    artist
  )}&album=${encodeURIComponent(album)}&api_key=${api}&format=json`;
  const response = await fetch(query);
  if (response.status === 200) {
    const data: any = await response.json();
    if ("album" in data && "image" in data.album) {
      const images = data.album.image || [];
      if (images.length > 0) {
        const artwork = images[images.length - 1]["#text"];
        if (artwork) {
          artworks.set(key, artwork);
          return artwork;
        }
      }
    }
  }
  if (album.includes(" - Single")) {
    return await getAlbumArtwork(artist, album.replace(" - Single", ""));
  }
  return undefined;
};

export const getArtworkOnFallback = async (id: string, size?: number) => {
  const data = await runAppleScript(`
    tell application "Music"
      set trackArtwork to first artwork of first track of (every track whose database ID is ${id})
      set trackImage to data of trackArtwork
    end tell
    return trackImage
  `);
  return await parseImageStream(data, size ? { width: size, height: size } : undefined);
};

export const getTrackArtwork = async (track: Track): Promise<string> => {
  return (await getAlbumArtwork(track.albumArtist, track.album)) || "../assets/no-track.png";
};
