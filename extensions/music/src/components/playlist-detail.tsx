import { List, Detail } from "@raycast/api";
import json2md from "json2md";

import { Playlist } from "../util/models";
import { FallbackImages } from "../util/presets";
import { titleCase } from "../util/utils";

export const PlaylistDetail = ({ playlist }: { playlist: Playlist }) => {
  const items: json2md.DataObject[] = [{ h1: playlist.name }];
  if (playlist.artwork && playlist.artwork !== FallbackImages.NoTrack) {
    items.push({ img: { title: playlist.name, source: playlist.artwork } });
  }
  return <List.Item.Detail markdown={json2md(items)} metadata={<DetailMetadata playlist={playlist} list={true} />} />;
};

function Metadata<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata(props, context) : Detail.Metadata(props, context);
}

function MetadataLabel<T>(props: any & { list: boolean }, context?: T) {
  return props.list ? List.Item.Detail.Metadata.Label(props, context) : Detail.Metadata.Label(props, context);
}

const DetailMetadata = ({ playlist, list }: { playlist: Playlist; list?: boolean }) => {
  return (
    <Metadata list={list}>
      <MetadataLabel list={list} title={"Number of Tracks"} text={playlist.count.toString()} />
      <MetadataLabel list={list} title={"Playlist Kind"} text={titleCase(playlist.kind)} />
      <MetadataLabel list={list} title={"Duration"} text={playlist.time} />
    </Metadata>
  );
};
