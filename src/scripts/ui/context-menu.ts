import { dialogs, inputs, media, menus } from "../dom.ts";
import {
  getAnimationSettings,
  getVisualizerSettings,
  resetSettings,
  updateAnimationSetting,
  updateVisualizerSetting,
} from "../app/settings.ts";
import { togglePlayback } from "../app/media.ts";
import { navigate } from "../app/lyrics-actions.ts";

type ContextMenuAction =
  | "edit-lyrics"
  | "change-background"
  | "change-music"
  | "toggle-playback"
  | "previous-lyric"
  | "next-lyric"
  | "toggle-settings"
  | "reset-settings";

type SettingControl = {
  input: HTMLInputElement | HTMLSelectElement;
  output: HTMLOutputElement;
  renderValue: (value: string) => string;
};

type SettingControlMap = {
  barCount: SettingControl;
  maxHeightPx: SettingControl;
  smoothing: SettingControl;
  fftSize: SettingControl;
  minFrequencyHz: SettingControl;
  maxFrequencyHz: SettingControl;
  lyricFadeOutMs: SettingControl;
  lyricFadeInMs: SettingControl;
  partRevealMs: SettingControl;
};

let isSettingsExpanded = false;

function getSettingControls(): SettingControlMap {
  return {
    barCount: {
      input: document.getElementById("barCountInput") as HTMLInputElement,
      output: document.getElementById("barCountValue") as HTMLOutputElement,
      renderValue: (value) => `${value}\uAC1C`,
    },
    maxHeightPx: {
      input: document.getElementById("barHeightInput") as HTMLInputElement,
      output: document.getElementById("barHeightValue") as HTMLOutputElement,
      renderValue: (value) => `${value}px`,
    },
    smoothing: {
      input: document.getElementById("smoothingInput") as HTMLInputElement,
      output: document.getElementById("smoothingValue") as HTMLOutputElement,
      renderValue: (value) => Number(value).toFixed(2),
    },
    fftSize: {
      input: document.getElementById("fftSizeInput") as HTMLSelectElement,
      output: document.getElementById("fftSizeValue") as HTMLOutputElement,
      renderValue: (value) => value,
    },
    minFrequencyHz: {
      input: document.getElementById("minFrequencyInput") as HTMLInputElement,
      output: document.getElementById("minFrequencyValue") as HTMLOutputElement,
      renderValue: (value) => `${value}Hz`,
    },
    maxFrequencyHz: {
      input: document.getElementById("maxFrequencyInput") as HTMLInputElement,
      output: document.getElementById("maxFrequencyValue") as HTMLOutputElement,
      renderValue: (value) => `${value}Hz`,
    },
    lyricFadeOutMs: {
      input: document.getElementById("lyricFadeOutInput") as HTMLInputElement,
      output: document.getElementById("lyricFadeOutValue") as HTMLOutputElement,
      renderValue: (value) => `${value}ms`,
    },
    lyricFadeInMs: {
      input: document.getElementById("lyricFadeInInput") as HTMLInputElement,
      output: document.getElementById("lyricFadeInValue") as HTMLOutputElement,
      renderValue: (value) => `${value}ms`,
    },
    partRevealMs: {
      input: document.getElementById("partRevealInput") as HTMLInputElement,
      output: document.getElementById("partRevealValue") as HTMLOutputElement,
      renderValue: (value) => `${(Number(value) / 1000).toFixed(1)}\uCD08`,
    },
  };
}

function setSettingsExpanded(expanded: boolean): void {
  isSettingsExpanded = expanded;
  menus.settingsPanel.hidden = !expanded;
  menus.settingsBackdrop.hidden = !expanded;
  menus.contextSettingsToggle.setAttribute("aria-expanded", String(expanded));
}

function openSettingsPanel(): void {
  syncSettingsForm();
  setSettingsExpanded(true);
  menus.settingsPanel.classList.add("is-open");
}

function closeSettingsPanel(): void {
  menus.settingsPanel.classList.remove("is-open");
  setSettingsExpanded(false);
}

export function closeContextMenu(): void {
  menus.context.hidden = true;
}

function updateContextMenuLabels(): void {
  const labelMap: Array<[ContextMenuAction, string]> = [
    ["edit-lyrics", "\uAC00\uC0AC \uC218\uC815"],
    ["change-background", "\uBC30\uACBD \uBCC0\uACBD"],
    ["change-music", "\uC74C\uC545 \uBCC0\uACBD"],
    ["previous-lyric", "\uC774\uC804 \uAC00\uC0AC"],
    ["next-lyric", "\uB2E4\uC74C \uAC00\uC0AC"],
    ["toggle-settings", "\uC0C1\uC138 \uC870\uC815"],
  ];

  labelMap.forEach(([action, label]) => {
    const button = menus.context.querySelector<HTMLElement>(
      `[data-action="${action}"]`,
    );
    if (button) {
      button.textContent = label;
    }
  });

  const playButton = menus.context.querySelector<HTMLElement>(
    '[data-action="toggle-playback"]',
  );
  if (playButton) {
    playButton.textContent = media.music.paused
      ? "\uC7AC\uC0DD"
      : "\uC77C\uC2DC\uC815\uC9C0";
  }
}

function syncSettingsForm(): void {
  const controls = getSettingControls();
  const visualizer = getVisualizerSettings();
  const animation = getAnimationSettings();

  const values = {
    barCount: String(visualizer.barCount),
    maxHeightPx: String(visualizer.maxHeightPx),
    smoothing: String(visualizer.smoothing),
    fftSize: String(visualizer.fftSize),
    minFrequencyHz: String(visualizer.minFrequencyHz),
    maxFrequencyHz: String(visualizer.maxFrequencyHz),
    lyricFadeOutMs: String(animation.lyricFadeOutMs),
    lyricFadeInMs: String(animation.lyricFadeInMs),
    partRevealMs: String(animation.partRevealMs),
  };

  Object.entries(controls).forEach(([key, control]) => {
    const value = values[key as keyof typeof values];
    control.input.value = value;
    const rendered = control.renderValue(value);
    control.output.value = rendered;
    control.output.textContent = rendered;
  });
}

function bindControlUpdates(): void {
  const controls = getSettingControls();

  const handleInput = (
    control: SettingControl,
    onChange: (value: string) => void,
  ) => {
    const commit = () => {
      onChange(control.input.value);
      syncSettingsForm();
    };

    control.input.addEventListener("input", commit);
    control.input.addEventListener("change", commit);
  };

  handleInput(controls["barCount"], (value) => {
    updateVisualizerSetting("barCount", Number(value));
  });
  handleInput(controls["maxHeightPx"], (value) => {
    updateVisualizerSetting("maxHeightPx", Number(value));
  });
  handleInput(controls["smoothing"], (value) => {
    updateVisualizerSetting("smoothing", Number(value));
  });
  handleInput(controls["fftSize"], (value) => {
    updateVisualizerSetting("fftSize", Number(value));
  });
  handleInput(controls["minFrequencyHz"], (value) => {
    updateVisualizerSetting("minFrequencyHz", Number(value));
  });
  handleInput(controls["maxFrequencyHz"], (value) => {
    updateVisualizerSetting("maxFrequencyHz", Number(value));
  });
  handleInput(controls["lyricFadeOutMs"], (value) => {
    updateAnimationSetting("lyricFadeOutMs", Number(value));
  });
  handleInput(controls["lyricFadeInMs"], (value) => {
    updateAnimationSetting("lyricFadeInMs", Number(value));
  });
  handleInput(controls["partRevealMs"], (value) => {
    updateAnimationSetting("partRevealMs", Number(value));
  });
}

function openContextMenu(x: number, y: number): void {
  updateContextMenuLabels();
  syncSettingsForm();
  menus.context.hidden = false;

  const { innerWidth, innerHeight } = window;
  const menuRect = menus.context.getBoundingClientRect();
  const safeLeft = Math.min(x, innerWidth - menuRect.width - 12);
  const safeTop = Math.min(y, innerHeight - menuRect.height - 12);

  menus.context.style.left = `${Math.max(12, safeLeft)}px`;
  menus.context.style.top = `${Math.max(12, safeTop)}px`;
}

function runContextMenuAction(action: ContextMenuAction): boolean {
  switch (action) {
    case "edit-lyrics":
      if (!dialogs.lyrics.open) {
        dialogs.lyrics.showModal();
      }
      return true;
    case "change-background":
      inputs.backgroundFile.click();
      return true;
    case "change-music":
      inputs.musicFile.click();
      return true;
    case "toggle-playback":
      togglePlayback();
      return true;
    case "previous-lyric":
      navigate(-1);
      return true;
    case "next-lyric":
      navigate(1);
      return true;
    case "toggle-settings":
      openSettingsPanel();
      return true;
    case "reset-settings":
      resetSettings();
      syncSettingsForm();
      return false;
  }
}

export function setupContextMenu(): void {
  setSettingsExpanded(false);
  syncSettingsForm();
  bindControlUpdates();

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

    const shouldClose = runContextMenuAction(action);
    if (shouldClose) {
      closeContextMenu();
    }
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

  menus.settingsBackdrop.addEventListener("click", closeSettingsPanel);
  menus.settingsClose.addEventListener("click", closeSettingsPanel);

  document.addEventListener("scroll", closeContextMenu, true);
  window.addEventListener("resize", closeContextMenu);
  window.addEventListener("blur", closeContextMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSettingsExpanded) {
      closeSettingsPanel();
    }
  });

  media.music.addEventListener("play", updateContextMenuLabels);
  media.music.addEventListener("pause", updateContextMenuLabels);
  media.music.addEventListener("ended", updateContextMenuLabels);
}
