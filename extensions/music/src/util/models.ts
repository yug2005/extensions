export enum PlayerState {
  Playing = "playing",
  Paused = "paused",
  Stopped = "stopped",
}

export type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArtist: string;
  genre: string;
  dateAdded: number;
  playedCount: number;
  duration: number;
  time: string;
  year: string;
  inLibrary: boolean;
  favorited: boolean;
  disliked: boolean;
  rating: number;
  artwork?: string;
};

export enum PlaylistKind {
  ALL = "all",
  USER = "user playlist",
  SUBSCRIPTION = "subscription playlist",
}

export type Playlist = {
  id: string;
  name: string;
  duration: string;
  count: number;
  time: string;
  kind: PlaylistKind;
  tracks: string[];
  artwork?: string;
};

export type Album = {
  id: string;
  name: string;
  artist: string;
  genre: string;
  dateAdded: number;
  playedCount: number;
  duration: number;
  year: string;
  tracks: Track[];
  artwork?: string;
};

export type MusicState = {
  name: string;
  artist: string;
  playing: PlayerState;
  repeat: string;
  shuffle: boolean;
  inLibrary: boolean;
  favorited: boolean;
  disliked: boolean;
  rating: number;
};

export enum SortOption {
  DateAdded = "Date Added",
  Artist = "Artist",
  Album = "Album",
  Title = "Title",
  PlayedCount = "Played Count",
  PlayedDuration = "Played Duration",
  Random = "Random",
}

export enum TrackDropdownOption {
  SortBy = "sort",
  Genre = "genre",
}

export enum LayoutType {
  List = "list",
  Grid = "grid",
}

export type Preferences = {
  apiKey: string;
  gridColumns: number;
  mainLayout: LayoutType;
  albumsLayout: LayoutType;
  albumTracksLayout: LayoutType;
  playlistTracksLayout: LayoutType;
  trackDropdown: TrackDropdownOption;
};
