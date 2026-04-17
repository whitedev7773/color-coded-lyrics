import { state, createArtists } from "./state.ts";
import { parseLyrics, extractArtists, resolveArtists } from "./parser.ts";
import { renderArtistPanels, renderCurrentLyric } from "./renderer.ts";
import { createBlankEntry, isValidIndex } from "./utils.ts";
import { dialogs, inputs, buttons, images, overlays } from "./dom.ts";
import { KEYBOARD_SHORTCUTS } from "./constants.ts";

/**
 * 가사를 적용합니다
 */
export function applyLyrics(text: string): void {
  const raw = [createBlankEntry(), ...parseLyrics(text), createBlankEntry()];
  const resolved = resolveArtists(raw);
  const artistNames = extractArtists(raw);

  const existingByName = new Map(state.artists.map((a) => [a.name, a]));
  const newArtists = createArtists(artistNames).map(
    (a) => existingByName.get(a.name) ?? a,
  );

  state.rawEntries = raw;
  state.resolvedEntries = resolved;
  state.artists = newArtists;
  state.currentIndex = 0;

  renderArtistPanels();
  renderCurrentLyric();
  dialogs.lyrics.close();
}

/**
 * 네비게이션을 처리합니다
 */
export function navigate(delta: number): void {
  const next = state.currentIndex + delta;
  if (!isValidIndex(next, state.resolvedEntries.length)) return;
  state.currentIndex = next;
  renderCurrentLyric();
}

/**
 * 이벤트 리스너를 등록합니다
 */
export function setupEventListeners(): void {
  // 가사 적용 버튼
  buttons.applyLyrics.addEventListener("click", () => {
    const text = inputs.lyricsTextarea.value.trim();
    if (text) applyLyrics(text);
  });

  // 배경 이미지 업로드
  inputs.backgroundFile.addEventListener("change", () => {
    const file = inputs.backgroundFile.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    images.background.src = url;
    images.background.classList.add("visible");
    overlays.background.classList.add("visible");
  });

  // 키보드 단축키
  document.addEventListener("keydown", (e) => {
    if (dialogs.lyrics.open) return;

    if (e.key === KEYBOARD_SHORTCUTS.PREVIOUS) {
      navigate(-1);
    } else if (e.key === KEYBOARD_SHORTCUTS.NEXT) {
      navigate(1);
    } else if ((KEYBOARD_SHORTCUTS.EDIT as readonly string[]).includes(e.key)) {
      dialogs.lyrics.showModal();
    } else if ((KEYBOARD_SHORTCUTS.BACKGROUND as readonly string[]).includes(e.key)) {
      inputs.backgroundFile.click();
    }
  });
}
