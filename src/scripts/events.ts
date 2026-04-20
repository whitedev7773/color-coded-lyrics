import { state, createArtists } from "./state.ts";
import { parseLyrics, extractArtists, resolveArtists } from "./parser.ts";
import { renderArtistPanels, renderCurrentLyric } from "./renderer.ts";
import { createBlankEntry, isValidIndex } from "./utils.ts";
import { dialogs, inputs, buttons, images, overlays, media } from "./dom.ts";
import { KEYBOARD_SHORTCUTS } from "./constants.ts";

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

export function navigate(delta: number): void {
  const next = state.currentIndex + delta;
  if (!isValidIndex(next, state.resolvedEntries.length)) return;
  state.currentIndex = next;
  renderCurrentLyric();
}

function setBackgroundImage(file: File): void {
  const url = URL.createObjectURL(file);
  images.background.src = url;
  images.background.classList.add("visible");
  overlays.background.classList.add("visible");
}

function setMusicSource(file: File): void {
  if (state.musicUrl) URL.revokeObjectURL(state.musicUrl);

  const url = URL.createObjectURL(file);
  state.musicUrl = url;
  media.music.src = url;
  media.music.load();
}

function togglePlayback(): void {
  if (!media.music.src) return;

  if (media.music.paused) {
    void media.music.play();
    return;
  }

  media.music.pause();
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement &&
    (target.tagName === "TEXTAREA" ||
      target.tagName === "INPUT" ||
      target.isContentEditable);
}

export function setupEventListeners(): void {
  buttons.applyLyrics.addEventListener("click", () => {
    const text = inputs.lyricsTextarea.value.trim();
    if (text) applyLyrics(text);
  });

  inputs.backgroundFile.addEventListener("change", () => {
    const file = inputs.backgroundFile.files?.[0];
    if (!file) return;
    setBackgroundImage(file);
  });

  inputs.musicFile.addEventListener("change", () => {
    const file = inputs.musicFile.files?.[0];
    if (!file) return;
    setMusicSource(file);
  });

  document.addEventListener("keydown", (e) => {
    if (isTypingTarget(e.target)) return;

    if (e.key === KEYBOARD_SHORTCUTS.PREVIOUS) {
      navigate(-1);
    } else if (e.key === KEYBOARD_SHORTCUTS.NEXT) {
      navigate(1);
    } else if ((KEYBOARD_SHORTCUTS.EDIT as readonly string[]).includes(e.key)) {
      if (!dialogs.lyrics.open) dialogs.lyrics.showModal();
    } else if ((KEYBOARD_SHORTCUTS.BACKGROUND as readonly string[]).includes(e.key)) {
      inputs.backgroundFile.click();
    } else if ((KEYBOARD_SHORTCUTS.MUSIC as readonly string[]).includes(e.key)) {
      inputs.musicFile.click();
    } else if ((KEYBOARD_SHORTCUTS.PLAY_TOGGLE as readonly string[]).includes(e.key)) {
      e.preventDefault();
      togglePlayback();
    }
  });
}
