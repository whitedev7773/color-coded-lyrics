import { inputs } from "../dom.ts";
import type { Artist } from "../state.ts";
import { state } from "../state.ts";

const LYRICS_DRAFT_KEY = "color-lyrics:draft";
const SESSION_KEY = "color-lyrics:session";

export interface PersistedArtistState {
  name: string;
  color: string;
}

export interface PersistedSession {
  lyricsText: string;
  currentIndex: number;
  artists: PersistedArtistState[];
}

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "localStorage" in window;
  } catch {
    return false;
  }
}

function readStorage(key: string): string | null {
  if (!isStorageAvailable()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function loadLyricsDraft(): string | null {
  return readStorage(LYRICS_DRAFT_KEY);
}

export function saveLyricsDraft(text: string): void {
  writeStorage(LYRICS_DRAFT_KEY, text);
}

export function loadSession(): PersistedSession | null {
  const raw = readStorage(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (
      typeof parsed.lyricsText !== "string" ||
      typeof parsed.currentIndex !== "number" ||
      !Array.isArray(parsed.artists)
    ) {
      return null;
    }

    const artists = parsed.artists.flatMap((artist) => {
      if (
        !artist ||
        typeof artist !== "object" ||
        typeof artist.name !== "string" ||
        typeof artist.color !== "string"
      ) {
        return [];
      }

      return [{ name: artist.name, color: artist.color }];
    });

    return {
      lyricsText: parsed.lyricsText,
      currentIndex: parsed.currentIndex,
      artists,
    };
  } catch {
    return null;
  }
}

function serializeArtists(artists: Artist[]): PersistedArtistState[] {
  return artists.map((artist) => ({
    name: artist.name,
    color: artist.color,
  }));
}

export function saveSessionFromState(): void {
  const lyricsText = inputs.lyricsTextarea.value.trim();
  if (!lyricsText) {
    return;
  }

  const session: PersistedSession = {
    lyricsText,
    currentIndex: state.currentIndex,
    artists: serializeArtists(state.artists),
  };

  writeStorage(SESSION_KEY, JSON.stringify(session));
}
