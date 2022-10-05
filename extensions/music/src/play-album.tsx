import { Grid, List, Action, ActionPanel, Icon, closeMainWindow } from "@raycast/api";
import { pipe, flow } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/ReadonlyArray";
import * as T from "fp-ts/Task";
import { useState, useEffect } from "react";

import { Tracks } from "./tracks";
import { handleTaskEitherError } from "./util/error-handling";
import {
  ListOrGrid,
  ListOrGridDropdown,
  ListOrGridDropdownSection,
  ListOrGridDropdownItem,
  gridItemSize,
  mainLayout,
  LayoutType,
  albumLayout,
} from "./util/list-or-grid";
import { Album } from "./util/models";
import { Icons } from "./util/presets";
import * as music from "./util/scripts";
import * as TE from "./util/task-either";

export default function PlayAlbum() {
  const [albums, setAlbums] = useState<readonly Album[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>("");
  const setSearchTerm = (term: string) => setSearch(term.toLowerCase().trim());

  const [genre, setGenre] = useState<string>("all");

  useEffect(() => {
    const getAlbums = async () => {
      const albums = await pipe(
        music.track.getAllTracks(),
        handleTaskEitherError("An error has occurred."),
        TE.map(
          flow(
            A.map((track) => {
              const id = `${track.album}-${track.albumArtist}`;

              return pipe(
                [] as Album[],
                A.findFirst((s) => s.id === id),
                O.map((a) => ({ ...a, tracks: [...a.tracks, track] })),
                O.getOrElse(
                  () =>
                    ({
                      id,
                      name: track.album,
                      artist: track.albumArtist ?? track.artist,
                      artwork: track.artwork,
                      genre: track.genre,
                      tracks: [track],
                    } as Album)
                )
              );
            })
          )
        ),
        TE.getOrElse(() => T.of([] as readonly Album[]))
      )();

      setAlbums(albums);
      setIsLoading(false);
    };
    getAlbums();
  }, []);

  return (
    <ListOrGrid
      isLoading={isLoading}
      searchBarPlaceholder="Search an album by title or artist"
      onSearchTextChange={setSearchTerm}
      itemSize={gridItemSize}
      searchBarAccessory={
        <ListOrGridDropdown tooltip="Genres" onChange={setGenre}>
          <ListOrGridDropdownItem value="all" title="All Genres" />
          <ListOrGridDropdownSection>
            {Array.from(new Set(albums.map((track) => track.genre)))
              .sort((a, b) => a.localeCompare(b))
              .map((genre: string, index: number) => (
                <ListOrGridDropdownItem key={index} title={genre} value={genre} />
              ))}
          </ListOrGridDropdownSection>
        </ListOrGridDropdown>
      }
    >
      {albums
        .filter((album: Album) => genre === "all" || album.genre === genre)
        .filter((album: Album) => {
          return album.name.toLowerCase().includes(search) || album.artist.toLowerCase().includes(search);
        })
        .sort((a: Album, b: Album) => a.artist.localeCompare(b.artist) || a.name.localeCompare(b.name))
        .map((album, idx) =>
          mainLayout === LayoutType.Grid ? (
            <Grid.Item
              key={idx}
              id={idx.toString()}
              title={album.name}
              subtitle={album.artist}
              content={album.artwork || "../assets/no-track.png"}
              actions={<Actions album={album} />}
            />
          ) : (
            <List.Item
              key={idx}
              id={idx.toString()}
              title={album.name}
              accessories={[{ text: album.artist }]}
              icon={album.artwork || "../assets/no-track.png"}
              actions={<Actions album={album} />}
            />
          )
        )}
    </ListOrGrid>
  );
}

function Actions({ album }: { album: Album }) {
  return (
    <ActionPanel>
      <Action
        title="Play Album"
        icon={Icon.Play}
        onAction={async () => {
          await music.albums.play(album);
          await closeMainWindow();
        }}
      />
      <Action
        title="Shuffle Album"
        icon={Icon.Shuffle}
        onAction={async () => {
          await music.albums.shuffle(album);
          await closeMainWindow();
        }}
      />
      <ActionPanel.Section>
        <Action.Push
          title="Show Tracks"
          icon={Icon.BulletPoints}
          shortcut={{ modifiers: ["cmd"], key: "o" }}
          target={<Tracks isLoading={false} tracks={album.tracks} overrideLayout={albumLayout} dropdown={false} />}
        />
        <Action
          title="Show in Apple Music"
          icon={Icons.Music}
          shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
          onAction={async () => {
            await music.albums.show(album);
            await closeMainWindow();
          }}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
