import { Icon, Color, Image } from "@raycast/api";

export const AppleMusicColor = "#fb556d";

export const FallbackImages = {
  NoTrack: "../assets/no-track.png",
  NoPlaylist: "../assets/no-playlist.png",
};

export const Icons = {
  Album: {
    source: "../assets/icons/album-icon.svg",
    tintColor: Color.PrimaryText,
  },
  Audio: {
    source: "../assets/icons/audio.png",
    tintColor: Color.PrimaryText,
  },
  Delete: {
    source: Icon.Trash,
    tintColor: Color.Red,
  },
  Dislike: {
    source: "../assets/icons/dislike.png",
    tintColor: Color.PrimaryText,
  },
  DislikeFilled: {
    source: "../assets/icons/dislike-filled.png",
    tintColor: Color.Red,
  },
  Heart: {
    source: "../assets/icons/heart.png",
    tintColor: Color.PrimaryText,
  },
  HeartFilled: {
    source: "../assets/icons/heart-filled.png",
    tintColor: Color.Red,
  },
  Music: {
    source: {
      light: "../assets/icons/music-light.svg",
      dark: "../assets/icons/music-dark.svg",
    },
  },
  Next: {
    source: "../assets/icons/next.png",
    tintColor: Color.PrimaryText,
  },
  NotPlaying: {
    source: "../assets/not-playing.svg",
  },
  Pause: {
    source: "../assets/icons/pause.png",
    tintColor: Color.PrimaryText,
  },
  Play: {
    source: "../assets/icons/play.png",
    tintColor: Color.PrimaryText,
  },
  Playlist: {
    source: "../assets/icons/playlist-icon.svg",
    tintColor: Color.PrimaryText,
  },
  Previous: {
    source: "../assets/icons/previous.png",
    tintColor: Color.PrimaryText,
  },
  Repeat: {
    Default: {
      source: "../assets/icons/repeat.svg",
      tintColor: Color.PrimaryText,
    },
    All: {
      source: "../assets/icons/repeat.png",
      tintColor: AppleMusicColor,
    },
    Off: {
      source: "../assets/icons/repeat.png",
      tintColor: Color.PrimaryText,
    },
    One: {
      source: "../assets/icons/repeat-one.png",
      tintColor: AppleMusicColor,
    },
  },
  Restart: {
    source: "../assets/icons/restart.png",
    tintColor: Color.PrimaryText,
  },
  Shuffle: {
    Default: {
      source: "../assets/icons/shuffle.svg",
      tintColor: Color.PrimaryText,
    },
    Disabled: {
      source: "../assets/icons/shuffle.png",
      tintColor: Color.PrimaryText,
    },
    Enabled: {
      source: "../assets/icons/shuffle.png",
      tintColor: AppleMusicColor,
    },
  },
  Song: {
    source: "../assets/icons/song.png",
    tintColor: Color.PrimaryText,
  },
  Star: {
    source: "../assets/icons/star.png",
    tintColor: Color.PrimaryText,
  },
  StarFilled: {
    source: "../assets/icons/star-filled.png",
    tintColor: Color.PrimaryText,
  },
};

export const repeatModes: { [key: string]: { title: string; icon: Image.ImageLike } } = {
  off: {
    title: "Off",
    icon: Icons.Repeat.Off,
  },
  all: {
    title: "All",
    icon: Icons.Repeat.All,
  },
  one: {
    title: "One",
    icon: Icons.Repeat.One,
  },
};
