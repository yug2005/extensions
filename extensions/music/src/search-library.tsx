import Fuse from "fuse.js";
import { useEffect, useState } from "react";

import { TrackItem } from "./components/tracks";
import { AlbumItem } from "./play-album";
import { PlaylistItem } from "./play-playlist";
import * as music from "./scripts";
import {
  ListOrGrid,
  ListOrGridSection,
  ListOrGridDropdown,
  ListOrGridDropdownItem,
  ListOrGridDropdownSection,
  gridColumns,
  mainLayout,
  ListOrGridEmptyView,
} from "./util/list-or-grid";
import { Track, Playlist, Album } from "./util/models";
import { Icons } from "./util/presets";
import { getAlbums } from "./util/utils";

enum Filter {
  All = "all",
  Tracks = "tracks",
  Albums = "albums",
  Playlists = "playlists",
}

export default function Search() {
  const [tracks, setTracks] = useState<readonly Track[]>([]);
  const [albums, setAlbums] = useState<readonly Album[]>([]);
  const [playlists, setPlaylists] = useState<readonly Playlist[]>([]);
  const [filter, setFilter] = useState<Filter>(Filter.All);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>("");

  const [showDetail, setShowDetail] = useState<boolean>(true);
  const toggleDetail = () => setShowDetail(!showDetail);

  useEffect(() => {
    music.track.getAllTracks().then((tracks) => {
      setTracks(tracks);
      setAlbums(getAlbums(tracks));
      music.playlists.getPlaylists().then((playlists) => {
        setPlaylists(playlists);
        setIsLoading(false);
      });
    });
  }, []);

  return (
    <ListOrGrid
      isLoading={isLoading}
      searchBarPlaceholder={"Search Apple Music"}
      onSearchTextChange={setSearch}
      columns={gridColumns}
      isShowingDetail={showDetail}
      layoutType={mainLayout}
      searchBarAccessory={
        <ListOrGridDropdown
          tooltip={"Filter By"}
          defaultValue={Filter.All}
          layoutType={mainLayout}
          onChange={(value: string) => {
            setFilter(value as Filter);
          }}
        >
          <ListOrGridDropdownItem value={Filter.All} title={"All"} layoutType={mainLayout} />
          <ListOrGridDropdownSection layoutType={mainLayout}>
            <ListOrGridDropdownItem value={Filter.Albums} title={"Albums"} layoutType={mainLayout} />
            <ListOrGridDropdownItem value={Filter.Playlists} title={"Playlists"} layoutType={mainLayout} />
            <ListOrGridDropdownItem value={Filter.Tracks} title={"Tracks"} layoutType={mainLayout} />
          </ListOrGridDropdownSection>
        </ListOrGridDropdown>
      }
    >
      <ListOrGridEmptyView
        title={"No Results"}
        description={"Search for tracks, albums, and playlists"}
        icon={Icons.NotPlaying}
        layoutType={mainLayout}
      />
      {(filter === Filter.All || filter === Filter.Playlists) && (
        <ListOrGridSection layoutType={mainLayout} title={"Playlists"}>
          {(() => {
            const fuse = new Fuse(playlists, {
              keys: ["name"],
              threshold: 0.3,
              ignoreLocation: true,
            });
            return fuse.search(search).map((result) => result.item);
          })().map((playlist) => (
            <PlaylistItem key={playlist.id} playlist={playlist} />
          ))}
        </ListOrGridSection>
      )}
      {(filter === Filter.All || filter === Filter.Tracks) && (
        <ListOrGridSection layoutType={mainLayout} title={"Tracks"}>
          {(() => {
            const fuse = new Fuse(tracks, {
              keys: ["name", "artist", "album"],
              threshold: 0.3,
              ignoreLocation: true,
            });
            return fuse.search(search).map((result) => result.item);
          })().map((track) => (
            <TrackItem key={track.id} track={track} layout={mainLayout} showDetail={showDetail} toggle={toggleDetail} />
          ))}
        </ListOrGridSection>
      )}
      {(filter === Filter.All || filter === Filter.Albums) && (
        <ListOrGridSection layoutType={mainLayout} title={"Albums"}>
          {(() => {
            const fuse = new Fuse(albums, {
              keys: ["name", "artist"],
              threshold: 0.3,
              ignoreLocation: true,
            });
            return fuse.search(search).map((result) => result.item);
          })().map((album) => (
            <AlbumItem key={album.id} album={album} layout={mainLayout} showDetail={showDetail} toggle={toggleDetail} />
          ))}
        </ListOrGridSection>
      )}
    </ListOrGrid>
  );
}
