import type { LyricEntry } from "./parser.ts";
import { COLORS } from "./constants.ts";

export interface Artist {
  name: string;
  color: string;
  imageUrl: string | null;
}

export interface AppState {
  rawEntries: LyricEntry[];
  resolvedEntries: LyricEntry[];
  artists: Artist[];
  currentIndex: number;
}

export function createArtists(names: string[]): Artist[] {
  return names.map((name, i) => ({
    name,
    color: COLORS[i % COLORS.length],
    imageUrl: null,
  }));
}

export const state: AppState = {
  rawEntries: [],
  resolvedEntries: [],
  artists: [],
  currentIndex: 0,
};
