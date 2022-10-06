import { URL } from "node:url";

import { Cache, getPreferenceValues } from "@raycast/api";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/ReadonlyArray";
import { Errors } from "io-ts";
import fetch from "node-fetch";
import resizeImg from "resize-image-buffer";

import { ExpirationTime, queryCache, setCache } from "./cache";
import { ILastFMAlbumResponse } from "./models";
import * as TE from "./task-either";

const preferences = getPreferenceValues();
const api: string = preferences.apiKey;

export type Size = {
  width: number;
  height: number;
};

enum ImageType {
  NONE = "",
  JPEG = "JPEG",
  PNG = "tdta",
}

export const parseImageStream = async (data: string, size?: Size): Promise<string> => {
  const imageType = data.slice(6, 10) as ImageType;
  if (imageType === ImageType.NONE) {
    console.warn("Unsupported Image Type: " + data.slice(6, 10));
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

const artworks = new Cache();

export const getAlbumArtwork = (artist: string, album: string): TE.TaskEither<Error | Errors, string | undefined> => {
  const key = `${artist}-${album}`;

  if (artworks.has(key)) {
    return TE.right(artworks.get(key));
  }

  const url = new URL("http://ws.audioscrobbler.com/2.0");
  url.searchParams.set("method", "album.getinfo");
  url.searchParams.set("artist", artist);
  url.searchParams.set("album", album);
  url.searchParams.set("api_key", api);
  url.searchParams.set("format", "json");

  const unavailable_urls = pipe(
    queryCache<string[]>("unavailable_urls", ExpirationTime.Week),
    O.getOrElse(() => [] as string[])
  );

  // skip if the url got error in the past week
  if (unavailable_urls.includes(url.href)) {
    return TE.right("../assets/no-track.png");
  }

  return pipe(
    TE.tryCatch(() => fetch(url.href), E.toError),
    TE.filterOrElseW(
      (a) => a.status == 200,
      (r) => new Error(r.statusText)
    ),
    TE.chainW((response) =>
      TE.tryCatch(
        () => response.json() as Promise<ILastFMAlbumResponse>,
        () => new Error("Could not parse JSON")
      )
    ),
    TE.tapLeft(() => setCache("unavailable_urls", [...unavailable_urls, url.href])),
    // check if the response is the expected one
    TE.chainEitherKW(ILastFMAlbumResponse.decode),
    TE.map((data) =>
      pipe(
        data.album?.image ?? [],
        A.last,
        O.match(
          () => "../assets/no-track.png",
          (s) => s["#text"]?.trim() || "../assets/no-track.png"
        )
      )
    )
  );
};
