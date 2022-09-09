import { List, Detail } from "@raycast/api";
import json2md from "json2md";

import { Album } from "../util/models";
import { FallbackImages } from "../util/presets";
import { formatDate, formatDuration } from "../util/utils";

export const AlbumDetail = ({ album }: { album: Album }) => {
  const items: json2md.DataObject[] = [{ h1: album.name }];
  if (album.artwork && album.artwork !== FallbackImages.NoTrack) {
    items.push({ img: { title: album.name, source: album.artwork } });
  }
  return <List.Item.Detail markdown={json2md(items)} metadata={<DetailMetadata album={album} list={true} />} />;
};

function Metadata<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata(props, context) : Detail.Metadata(props, context);
}

function MetadataLabel<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata.Label(props, context) : Detail.Metadata.Label(props, context);
}

const DetailMetadata = ({ album, list }: { album: Album; list?: boolean }) => {
  return (
    <Metadata list={list}>
      <MetadataLabel list={list} title={"Date Added"} text={formatDate(album.dateAdded)} />
      <MetadataLabel list={list} title={"Artist"} text={album.artist} />
      <MetadataLabel list={list} title={"Genre"} text={album.genre} />
      <MetadataLabel list={list} title={"Number of Tracks"} text={album.tracks.length.toString()} />
      <MetadataLabel list={list} title={"Year"} text={album.year.toString()} />
      <MetadataLabel list={list} title={"Duration"} text={formatDuration(album.duration)} />
      <MetadataLabel list={list} title={"Played Count"} text={album.playedCount.toString()} />
    </Metadata>
  );
};
