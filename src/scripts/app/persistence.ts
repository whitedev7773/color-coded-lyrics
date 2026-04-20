const LYRICS_DRAFT_KEY = "color-lyrics:draft";
const SESSION_KEY = "color-lyrics:session";

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "localStorage" in window;
  } catch {
    return false;
  }
}

export function clearLegacyLyricsStorage(): void {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(LYRICS_DRAFT_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}
