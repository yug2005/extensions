import { List, Toast, showToast, Detail } from "@raycast/api";
import json2md from "json2md";
import { useEffect, useState } from "react";

import { Track } from "./util/models";
import { getTrackDetails, getTrackArtwork } from "./util/scripts/track";
import { Icons } from "./util/utils";

export const TrackDetail = (props: { track: Track }) => {
  const [track, setTrack] = useState<Track | undefined>(undefined);
  const [markdown, setMarkdown] = useState<string | undefined>(undefined);

  useEffect(() => {
    const getTrack = async () => {
      try {
        const track = await getTrackDetails(props.track);
        const artwork = await getTrackArtwork(track);
        setTrack({ ...track, artwork });
        const items = [];
        items.push({ h1: track.name });
        if (track.artwork && track.artwork !== "../assets/no-track.png") {
          items.push({
            img: { source: track.artwork.replace("300x300", "174s") },
          });
        }
        setMarkdown(json2md(items));
      } catch {
        showToast(Toast.Style.Failure, "Could not get track details or artwork");
      }
    };
    getTrack();
  }, []);

  return (
    <List.Item.Detail
      isLoading={markdown === undefined}
      markdown={markdown}
      metadata={markdown && track && <DetailMetadata track={track} list={true} />}
    />
  );
};

function Metadata<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata(props, context) : Detail.Metadata(props, context);
}

function MetadataLabel<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata.Label(props, context) : Detail.Metadata.Label(props, context);
}

export const DetailMetadata = (props: { track: Track; list?: boolean }) => {
  const track = props.track;
  return (
    <Metadata {...props}>
      <MetadataLabel list={props.list} title="Loved" icon={track.loved ? Icons.HeartFilled : Icons.Heart} />
      {!props.list && <MetadataLabel title={"In Library"} text={track.inLibrary ? "Yes" : "No"} />}
      <MetadataLabel list={props.list} title="Album" text={track.album} />
      <MetadataLabel list={props.list} title="Artist" text={track.artist} />
      <MetadataLabel list={props.list} title="Genre" text={track.genre} />
      <MetadataLabel list={props.list} title="Duration" text={track.time} />
      <MetadataLabel
        list={props.list}
        title="Play Count"
        text={track.playedCount ? track.playedCount.toString() : "0"}
      />
      <MetadataLabel list={props.list} title="Rating" text={`${track.rating} Star${track.rating === 1 ? "" : "s"}`} />
      <MetadataLabel list={props.list} title="Year" text={track.year} />
    </Metadata>
  );
};
