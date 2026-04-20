import { dialogs, inputs, media, menus } from "../dom.ts";
import { togglePlayback } from "../app/media.ts";
import { navigate } from "../app/lyrics-actions.ts";

type ContextMenuAction =
  | "edit-lyrics"
  | "change-background"
  | "change-music"
  | "toggle-playback"
  | "previous-lyric"
  | "next-lyric";

export function closeContextMenu(): void {
  menus.context.hidden = true;
}

function updateContextMenuLabels(): void {
  const playButton = menus.context.querySelector<HTMLElement>(
    '[data-action="toggle-playback"]',
  );
  if (!playButton) {
    return;
  }

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
      if (!dialogs.lyrics.open) {
        dialogs.lyrics.showModal();
      }
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

export function setupContextMenu(): void {
  menus.context.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest<HTMLElement>("[data-action]");
    const action = button?.dataset["action"] as ContextMenuAction | undefined;
    if (!action) {
      return;
    }

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
}
