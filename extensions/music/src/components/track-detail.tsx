import { List, Detail } from "@raycast/api";
import json2md from "json2md";

import { Track } from "../util/models";
import { FallbackImages, Icons } from "../util/presets";
import { formatDate } from "../util/utils";

export const TrackDetail = ({ track }: { track: Track }) => {
  const items: json2md.DataObject[] = [{ h1: track.name }];
  if (track.artwork && track.artwork !== FallbackImages.NoTrack) {
    items.push({ img: { title: track.name, source: track.artwork } });
  }
  return <List.Item.Detail markdown={json2md(items)} metadata={<DetailMetadata track={track} list={true} />} />;
};

function Metadata<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata(props, context) : Detail.Metadata(props, context);
}

function MetadataLabel<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata.Label(props, context) : Detail.Metadata.Label(props, context);
}

export const DetailMetadata = ({ track, list }: { track: Track; list?: boolean }) => {
  return (
    <Metadata list={list}>
      <MetadataLabel list={list} title={"Date Added"} text={formatDate(track.dateAdded)} />
      <MetadataLabel list={list} title={"Album"} text={track.album} />
      <MetadataLabel list={list} title={"Artist"} text={track.artist} />
      <MetadataLabel list={list} title={"Genre"} text={track.genre} />
      <MetadataLabel list={list} title={"Duration"} text={track.time} />
      <MetadataLabel list={list} title={"Played Count"} text={track.playedCount.toString()} />
      <MetadataLabel list={list} title={"Year"} text={track.year.toString()} />
      {!list && <MetadataLabel title={"In Library"} text={track.inLibrary ? "Yes" : "No"} />}
      <MetadataLabel list={list} title={"Favorited"} icon={track.favorited ? Icons.HeartFilled : Icons.Heart} />
      <MetadataLabel list={list} title={"Disliked"} icon={track.disliked ? Icons.DislikeFilled : Icons.Dislike} />
      <MetadataLabel list={list} title={"Rating"} text={`${track.rating || 0} Star${track.rating === 1 ? "" : "s"}`} />
    </Metadata>
  );
};
