import { dialogs, inputs, buttons } from "./dom.ts";
import { KEYBOARD_SHORTCUTS } from "./constants.ts";
import { applyLyrics, navigate } from "./app/lyrics-actions.ts";
import { setBackgroundImage, setMusicSource, togglePlayback } from "./app/media.ts";
import { closeContextMenu, setupContextMenu } from "./ui/context-menu.ts";

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement &&
    (target.tagName === "TEXTAREA" ||
      target.tagName === "INPUT" ||
      target.isContentEditable);
}

export function setupEventListeners(): void {
  setupContextMenu();

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
