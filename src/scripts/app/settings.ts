const SETTINGS_KEY = "color-lyrics:settings";

export interface VisualizerSettings {
  barCount: number;
  maxHeightPx: number;
  smoothing: number;
  fftSize: number;
  minFrequencyHz: number;
  maxFrequencyHz: number;
}

export interface AnimationSettings {
  lyricFadeOutMs: number;
  lyricFadeInMs: number;
  partRevealMs: number;
}

export interface AppSettings {
  visualizer: VisualizerSettings;
  animation: AnimationSettings;
}

type SettingsListener = (settings: AppSettings) => void;

const DEFAULT_SETTINGS: AppSettings = {
  visualizer: {
    barCount: 200,
    maxHeightPx: 200,
    smoothing: 0.84,
    fftSize: 256,
    minFrequencyHz: 20,
    maxFrequencyHz: 20000,
  },
  animation: {
    lyricFadeOutMs: 150,
    lyricFadeInMs: 250,
    partRevealMs: 4000,
  },
};

const listeners = new Set<SettingsListener>();

let currentSettings: AppSettings = structuredClone(DEFAULT_SETTINGS);

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "localStorage" in window;
  } catch {
    return false;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeVisualizerSettings(
  visualizer: Partial<VisualizerSettings> | undefined,
): VisualizerSettings {
  const merged = {
    ...DEFAULT_SETTINGS.visualizer,
    ...visualizer,
  };

  const minFrequencyHz = clamp(
    Math.round(merged.minFrequencyHz),
    20,
    18000,
  );
  const maxFrequencyHz = clamp(
    Math.round(merged.maxFrequencyHz),
    minFrequencyHz + 100,
    20000,
  );

  const allowedFftSizes = [32, 64, 128, 256, 512, 1024, 2048];
  const fftSize = allowedFftSizes.includes(merged.fftSize)
    ? merged.fftSize
    : DEFAULT_SETTINGS.visualizer.fftSize;

  return {
    barCount: clamp(Math.round(merged.barCount), 24, 320),
    maxHeightPx: clamp(Math.round(merged.maxHeightPx), 80, 360),
    smoothing: clamp(Number(merged.smoothing), 0.1, 0.98),
    fftSize,
    minFrequencyHz,
    maxFrequencyHz,
  };
}

function sanitizeAnimationSettings(
  animation: Partial<AnimationSettings> | undefined,
): AnimationSettings {
  const merged = {
    ...DEFAULT_SETTINGS.animation,
    ...animation,
  };

  return {
    lyricFadeOutMs: clamp(Math.round(merged.lyricFadeOutMs), 50, 1000),
    lyricFadeInMs: clamp(Math.round(merged.lyricFadeInMs), 50, 1200),
    partRevealMs: clamp(Math.round(merged.partRevealMs), 800, 8000),
  };
}

function sanitizeSettings(settings: Partial<AppSettings> | undefined): AppSettings {
  return {
    visualizer: sanitizeVisualizerSettings(settings?.visualizer),
    animation: sanitizeAnimationSettings(settings?.animation),
  };
}

function persistSettings(): void {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
}

function applySettingsToDocument(settings: AppSettings): void {
  document.documentElement.style.setProperty(
    "--lyric-fade-out-duration",
    `${settings.animation.lyricFadeOutMs}ms`,
  );
  document.documentElement.style.setProperty(
    "--lyric-fade-in-duration",
    `${settings.animation.lyricFadeInMs}ms`,
  );
  document.documentElement.style.setProperty(
    "--part-reveal-duration",
    `${settings.animation.partRevealMs}ms`,
  );
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener(getAppSettings()));
}

export function getAppSettings(): AppSettings {
  return structuredClone(currentSettings);
}

export function getVisualizerSettings(): VisualizerSettings {
  return { ...currentSettings.visualizer };
}

export function getAnimationSettings(): AnimationSettings {
  return { ...currentSettings.animation };
}

export function initializeSettings(): void {
  if (isStorageAvailable()) {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      try {
        currentSettings = sanitizeSettings(JSON.parse(raw) as Partial<AppSettings>);
      } catch {
        currentSettings = structuredClone(DEFAULT_SETTINGS);
      }
    }
  }

  applySettingsToDocument(currentSettings);
}

export function subscribeToSettings(listener: SettingsListener): () => void {
  listeners.add(listener);
  listener(getAppSettings());
  return () => {
    listeners.delete(listener);
  };
}

export function updateVisualizerSetting<K extends keyof VisualizerSettings>(
  key: K,
  value: VisualizerSettings[K],
): void {
  currentSettings = {
    ...currentSettings,
    visualizer: sanitizeVisualizerSettings({
      ...currentSettings.visualizer,
      [key]: value,
    }),
  };

  persistSettings();
  notifyListeners();
}

export function updateAnimationSetting<K extends keyof AnimationSettings>(
  key: K,
  value: AnimationSettings[K],
): void {
  currentSettings = {
    ...currentSettings,
    animation: sanitizeAnimationSettings({
      ...currentSettings.animation,
      [key]: value,
    }),
  };

  applySettingsToDocument(currentSettings);
  persistSettings();
  notifyListeners();
}

export function resetSettings(): void {
  currentSettings = structuredClone(DEFAULT_SETTINGS);
  applySettingsToDocument(currentSettings);
  persistSettings();
  notifyListeners();
}
