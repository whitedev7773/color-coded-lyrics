import { setupEventListeners } from "./events.ts";
import { dialogs } from "./dom.ts";
import { clearLegacyLyricsStorage } from "./app/persistence.ts";
import { initializeSettings } from "./app/settings.ts";
import { setupSpectrumVisualizer } from "./visualizer.ts";

function initApp(): void {
  initializeSettings();
  clearLegacyLyricsStorage();
  setupEventListeners();
  setupSpectrumVisualizer();

  dialogs.lyrics.showModal();
}

initApp();
