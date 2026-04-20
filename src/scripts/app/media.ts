import type { Artist } from "../state.ts";
import { CSS_CLASSES } from "../constants.ts";
import { images, media, overlays } from "../dom.ts";
import { state } from "../state.ts";

let backgroundUrl: string | null = null;

function replaceObjectUrl(currentUrl: string | null, file: File): string {
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
  }

  return URL.createObjectURL(file);
}

export function setBackgroundImage(file: File): void {
  backgroundUrl = replaceObjectUrl(backgroundUrl, file);
  images.background.src = backgroundUrl;
  images.background.classList.add(CSS_CLASSES.VISIBLE);
  overlays.background.classList.add(CSS_CLASSES.VISIBLE);
}

export function setMusicSource(file: File): void {
  const nextUrl = replaceObjectUrl(state.musicUrl, file);
  state.musicUrl = nextUrl;
  media.music.src = nextUrl;
  media.music.load();
}

export function setArtistImage(
  artist: Artist,
  file: File,
  img: HTMLImageElement,
  imgWrap: HTMLElement,
): void {
  artist.imageUrl = replaceObjectUrl(artist.imageUrl, file);
  img.src = artist.imageUrl;
  imgWrap.classList.remove(CSS_CLASSES.NO_IMAGE);
}

export function togglePlayback(): void {
  if (!media.music.src) {
    return;
  }

  if (media.music.paused) {
    void media.music.play();
    return;
  }

  media.music.pause();
}
