import { state, createArtists } from "./state.ts";
import { parseLyrics, extractArtists, resolveArtists } from "./parser.ts";
import { renderArtistPanels, renderCurrentLyric } from "./renderer.ts";
import { createBlankEntry, isValidIndex } from "./utils.ts";
import { dialogs, inputs, buttons, images, overlays, media, menus } from "./dom.ts";
import { KEYBOARD_SHORTCUTS } from "./constants.ts";

type ContextMenuAction =
  | "edit-lyrics"
  | "change-background"
  | "change-music"
  | "toggle-playback"
  | "previous-lyric"
  | "next-lyric";

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

function closeContextMenu(): void {
  menus.context.hidden = true;
}

function updateContextMenuLabels(): void {
  const playButton = menus.context.querySelector<HTMLElement>(
    '[data-action="toggle-playback"]',
  );
  if (!playButton) return;
  playButton.textContent = media.music.paused ? "재생" : "일시정지";
}

function openContextMenu(x: number, y: number): void {
  updateContextMenuLabels();
  menus.context.hidden = false;

  const { innerWidth, innerHeight } = window;
  const menuRect = menus.context.getBoundingClientRect();
  const safeLeft = Math.min(x, innerWidth - menuRect.width - 12);
  const safeTop = Math.min(y, innerHeight - menuRect.height - 12);

  menus.context.style.left = `${Math.max(12, safeLeft)}px`;
  menus.context.style.top = `${Math.max(12, safeTop)}px`;
}

function runContextMenuAction(action: ContextMenuAction): void {
  switch (action) {
    case "edit-lyrics":
      if (!dialogs.lyrics.open) dialogs.lyrics.showModal();
      break;
    case "change-background":
      inputs.backgroundFile.click();
      break;
    case "change-music":
      inputs.musicFile.click();
      break;
    case "toggle-playback":
      togglePlayback();
      break;
    case "previous-lyric":
      navigate(-1);
      break;
    case "next-lyric":
      navigate(1);
      break;
  }
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

  menus.context.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest<HTMLElement>("[data-action]");
    const action = button?.dataset.action as ContextMenuAction | undefined;
    if (!action) return;

    runContextMenuAction(action);
    closeContextMenu();
  });

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    openContextMenu(event.clientX, event.clientY);
  });

  document.addEventListener("click", (event) => {
    if (!menus.context.hidden && !menus.context.contains(event.target as Node)) {
      closeContextMenu();
    }
  });

  document.addEventListener("scroll", closeContextMenu, true);
  window.addEventListener("resize", closeContextMenu);
  window.addEventListener("blur", closeContextMenu);

  media.music.addEventListener("play", updateContextMenuLabels);
  media.music.addEventListener("pause", updateContextMenuLabels);
  media.music.addEventListener("ended", updateContextMenuLabels);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeContextMenu();
    }

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
