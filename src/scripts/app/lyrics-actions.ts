import { dialogs } from "../dom.ts";
import { parseLyrics, extractArtists, resolveArtists } from "../parser.ts";
import { renderArtistPanels, renderCurrentLyric } from "../renderer.ts";
import { state, createArtists } from "../state.ts";
import { createBlankEntry, isValidIndex } from "../utils.ts";

export function applyLyrics(text: string): void {
  const raw = [createBlankEntry(), ...parseLyrics(text), createBlankEntry()];
  const resolved = resolveArtists(raw);
  const artistNames = extractArtists(raw);

  const existingByName = new Map(state.artists.map((artist) => [artist.name, artist]));
  const nextArtists = createArtists(artistNames).map(
    (artist) => existingByName.get(artist.name) ?? artist,
  );

  state.rawEntries = raw;
  state.resolvedEntries = resolved;
  state.artists = nextArtists;
  state.currentIndex = 0;

  renderArtistPanels();
  renderCurrentLyric();
  dialogs.lyrics.close();
}

export function navigate(delta: number): void {
  const nextIndex = state.currentIndex + delta;
  if (!isValidIndex(nextIndex, state.resolvedEntries.length)) {
    return;
  }

  state.currentIndex = nextIndex;
  renderCurrentLyric();
}
