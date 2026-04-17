import { setupEventListeners } from "./events.ts";
import { dialogs } from "./dom.ts";

// 앱 초기화
function initApp(): void {
  setupEventListeners();
  dialogs.lyrics.showModal();
}

// 앱 시작
initApp();
