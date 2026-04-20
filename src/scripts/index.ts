import { setupEventListeners } from "./events.ts";
import { dialogs } from "./dom.ts";
import { setupSpectrumVisualizer } from "./visualizer.ts";

function initApp(): void {
  setupEventListeners();
  setupSpectrumVisualizer();
  dialogs.lyrics.showModal();
}

initApp();
