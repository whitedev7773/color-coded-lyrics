import { setupEventListeners } from "./events.ts";
import { dialogs, inputs } from "./dom.ts";
import { applyLyrics } from "./app/lyrics-actions.ts";
import { loadLyricsDraft, loadSession } from "./app/persistence.ts";
import { initializeSettings } from "./app/settings.ts";
import { setupSpectrumVisualizer } from "./visualizer.ts";

function initApp(): void {
  initializeSettings();
  setupEventListeners();
  setupSpectrumVisualizer();

  const draft = loadLyricsDraft();
  if (draft) {
    inputs.lyricsTextarea.value = draft;
  }

  const session = loadSession();
  if (session?.lyricsText) {
    const artistColors = Object.fromEntries(
      session.artists.map((artist) => [artist.name, artist.color]),
    );
    inputs.lyricsTextarea.value = session.lyricsText;
    applyLyrics(session.lyricsText, {
      artistColors,
      closeDialog: false,
      initialIndex: session.currentIndex,
    });
    return;
  }

  dialogs.lyrics.showModal();
}

initApp();
