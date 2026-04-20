import { dialogs } from "../dom.ts";
import { parseLyrics, extractArtists, resolveArtists } from "../parser.ts";
import { renderArtistPanels, renderCurrentLyric } from "../renderer.ts";
import { state, createArtists } from "../state.ts";
import { createBlankEntry, isValidIndex } from "../utils.ts";

interface ApplyLyricsOptions {
  closeDialog?: boolean;
  initialIndex?: number;
}

export function applyLyrics(text: string, options: ApplyLyricsOptions = {}): void {
  const raw = [createBlankEntry(), ...parseLyrics(text), createBlankEntry()];
  const resolved = resolveArtists(raw);
  const artistNames = extractArtists(raw);

  const existingByName = new Map(state.artists.map((artist) => [artist.name, artist]));
  const nextArtists = createArtists(artistNames).map((artist) => {
    const existingArtist = existingByName.get(artist.name);

    return {
      ...(existingArtist ?? artist),
      color: existingArtist?.color ?? artist.color,
    };
  });

  state.rawEntries = raw;
  state.resolvedEntries = resolved;
  state.artists = nextArtists;
  state.currentIndex = isValidIndex(options.initialIndex ?? 0, resolved.length)
    ? options.initialIndex ?? 0
    : 0;

  renderArtistPanels();
  renderCurrentLyric();

  if (options.closeDialog ?? true) {
    if (dialogs.lyrics.open) {
      dialogs.lyrics.close();
    }
  }
}

export function navigate(delta: number): void {
  const nextIndex = state.currentIndex + delta;
  if (!isValidIndex(nextIndex, state.resolvedEntries.length)) {
    return;
  }

  state.currentIndex = nextIndex;
  renderCurrentLyric();
}
