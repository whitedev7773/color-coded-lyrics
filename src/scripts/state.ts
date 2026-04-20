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
  musicUrl: string | null;
}

export function createArtists(names: string[]): Artist[] {
  return names.map((name, i) => ({
    name,
    color: COLORS[i % COLORS.length] ?? COLORS[0] ?? "#5B8DEF",
    imageUrl: null,
  }));
}

export const state: AppState = {
  rawEntries: [],
  resolvedEntries: [],
  artists: [],
  currentIndex: 0,
  musicUrl: null,
};
