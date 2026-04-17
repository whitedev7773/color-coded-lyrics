import type { LyricEntry } from './parser.ts';

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

const COLORS = ['#5B8DEF', '#F06292', '#FF8A65', '#66BB6A', '#AB47BC', '#FFA726'];

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
