import { Action, ActionPanel, Icon, Image, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import Fuse from "fuse.js";
import _ from "lodash";
import { useState, useEffect } from "react";

import { AlbumDetail } from "./components/album-detail";
import { Tracks } from "./components/tracks";
import * as music from "./scripts";
import {
  ListOrGrid,
  ListOrGridItem,
  ListOrGridDropdown,
  ListOrGridDropdownSection,
  ListOrGridDropdownItem,
  gridColumns,
  albumsLayout,
  albumTracksLayout,
} from "./util/list-or-grid";
import { Album, SortOption, TrackDropdownOption, LayoutType, Preferences } from "./util/models";
import { FallbackImages, Icons } from "./util/presets";
import { sortCache, handleTaskEitherError, getAlbums } from "./util/utils";

export default function PlayAlbum() {
  const { trackDropdown } = getPreferenceValues<Preferences>();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [search, setSearch] = useState<string>("");

  const [genre, setGenre] = useState<string>("");
  const [sort, setSort] = useState<SortOption>((sortCache.get("album-sort") as SortOption) || SortOption.DateAdded);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAlbumDetail, setShowAlbumDetail] = useState<boolean>(true);
  const toggleAlbumDetail = () => setShowAlbumDetail(!showAlbumDetail);

  useEffect(() => {
    music.track.getAllTracks().then((tracks) => {
      setAlbums(getAlbums(tracks));
      setIsLoading(false);
    });
  }, []);

  return (
    <ListOrGrid
      isLoading={isLoading}
      searchBarPlaceholder={"Search an album by title or artist"}
      onSearchTextChange={setSearch}
      columns={gridColumns}
      isShowingDetail={showAlbumDetail}
      layoutType={albumsLayout}
      searchBarAccessory={
        trackDropdown === TrackDropdownOption.SortBy ? (
          <ListOrGridDropdown
            tooltip={"Sort By"}
            defaultValue={sort}
            layoutType={albumsLayout}
            onChange={(value: string) => {
              setSort(value as SortOption);
              sortCache.set("album-sort", value);
            }}
          >
            {Object.values(SortOption)
              .filter((option) => ![SortOption.Album, SortOption.PlayedDuration].includes(option))
              .map((option) => (
                <ListOrGridDropdownItem key={option} value={option} title={option} layoutType={albumsLayout} />
              ))}
          </ListOrGridDropdown>
        ) : (
          <ListOrGridDropdown tooltip={"Genres"} onChange={setGenre} layoutType={albumsLayout}>
            <ListOrGridDropdownItem value={""} title={"All Genres"} layoutType={albumsLayout} />
            <ListOrGridDropdownSection layoutType={albumsLayout}>
              {Array.from(new Set(albums.map((album) => album.genre)))
                .sort((a, b) => a.localeCompare(b))
                .map((genre: string, index: number) => (
                  <ListOrGridDropdownItem key={index} title={genre} value={genre} layoutType={albumsLayout} />
                ))}
            </ListOrGridDropdownSection>
          </ListOrGridDropdown>
        )
      }
    >
      {(() => {
        const filteredAlbums = albums.filter((album) => album.genre === genre || !genre);
        if (search) {
          const fuse = new Fuse(filteredAlbums, {
            keys: ["name", "artist"],
            threshold: 0.3,
            ignoreLocation: true,
          });
          return fuse.search(search).map((result) => result.item);
        } else {
          if (sort === SortOption.DateAdded) return _.sortBy(filteredAlbums, ["dateAdded"]).reverse();
          else if (sort === SortOption.Artist) return _.sortBy(filteredAlbums, ["artist", "name"]);
          else if (sort === SortOption.Title) return _.sortBy(filteredAlbums, ["name"]);
          else if (sort === SortOption.PlayedCount) return _.sortBy(filteredAlbums, ["playedCount"]).reverse();
          else if (sort === SortOption.Random) return _.shuffle(filteredAlbums);
          else return filteredAlbums;
        }
      })().map((album) => (
        <AlbumItem
          key={album.id}
          album={album}
          layout={albumsLayout}
          showDetail={showAlbumDetail}
          toggle={toggleAlbumDetail}
        />
      ))}
    </ListOrGrid>
  );
}

interface AlbumProps {
  album: Album;
  layout: LayoutType;
  showDetail?: boolean;
  toggle?: () => void;
}

export const AlbumItem = ({ album, layout, showDetail, toggle }: AlbumProps) => {
  return (
    <ListOrGridItem
      key={album.id}
      id={album.id}
      layoutType={layout}
      title={album.name}
      subtitle={layout === LayoutType.Grid ? album.artist : undefined}
      accessories={showDetail ? null : [{ text: album.artist }]}
      content={album.artwork || FallbackImages.NoTrack}
      icon={{
        source: album.artwork || FallbackImages.NoTrack,
        mask: layout === LayoutType.Grid ? undefined : Image.Mask.RoundedRectangle,
      }}
      detail={<AlbumDetail album={album} />}
      actions={
        <ActionPanel title={`${album.name} - ${album.artist}`}>
          <Action
            title={"Play Album"}
            icon={Icons.Play}
            onAction={pipe(
              album,
              music.albums.play(false),
              TE.map(() => closeMainWindow()),
              handleTaskEitherError
            )}
          />
          <Action
            title={"Shuffle Album"}
            icon={Icons.Shuffle.Default}
            onAction={pipe(
              album,
              music.albums.play(true),
              TE.map(() => closeMainWindow()),
              handleTaskEitherError
            )}
          />
          <Action.Push
            title={"Show Tracks"}
            icon={Icon.BulletPoints}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
            target={<Tracks tracks={album.tracks} overrideLayout={albumTracksLayout} isAlbum />}
          />
          <Action
            title={"Show in Apple Music"}
            icon={Icons.Music}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
            onAction={pipe(
              album,
              music.albums.show,
              TE.map(() => closeMainWindow()),
              handleTaskEitherError
            )}
          />
          <ActionPanel.Section>
            {layout === LayoutType.List && (
              <Action
                title={"Toggle Album Detail"}
                icon={Icon.AppWindowSidebarLeft}
                onAction={toggle}
                shortcut={{ modifiers: ["cmd"], key: "d" }}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
};
