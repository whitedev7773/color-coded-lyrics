import { media, visualizers } from "./dom.ts";
import { getVisualizerSettings, subscribeToSettings } from "./app/settings.ts";

const MIN_BAR_HEIGHT = 0.04;
const THEME_FADE_DURATION_MS = 300;

type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let frequencyData: Uint8Array<ArrayBuffer> | null = null;
let animationFrameId = 0;
let lastFrameAt = 0;
let hasStarted = false;

const defaultThemeColors = ["rgba(255, 255, 255, 0.78)"];

const theme = {
  colors: [...defaultThemeColors],
  fromColors: [...defaultThemeColors],
  targetColors: [...defaultThemeColors],
  transitionStartAt: 0,
};

function getLastColor(colors: readonly string[]): string {
  return colors[colors.length - 1] ?? defaultThemeColors[0] ?? "rgba(255, 255, 255, 0.78)";
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseRgba(color: string): RgbaColor {
  const match = color.match(
    /rgba?\(([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\)/,
  );

  if (!match) {
    return { r: 255, g: 255, b: 255, a: 0.78 };
  }

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] ? Number(match[4]) : 1,
  };
}

function toRgbaString(color: RgbaColor): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a.toFixed(3)})`;
}

function mixNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function mixColor(from: string, to: string, progress: number): string {
  const start = parseRgba(from);
  const end = parseRgba(to);
  return toRgbaString({
    r: mixNumber(start.r, end.r, progress),
    g: mixNumber(start.g, end.g, progress),
    b: mixNumber(start.b, end.b, progress),
    a: mixNumber(start.a, end.a, progress),
  });
}

function normalizeColorStops(colors: string[]): string[] {
  return colors.length > 0 ? colors : [...defaultThemeColors];
}

function getAnimatedThemeColors(timestamp: number): string[] {
  const fromColors = normalizeColorStops(theme.fromColors);
  const targetColors = normalizeColorStops(theme.targetColors);
  const stopCount = Math.max(fromColors.length, targetColors.length);

  const expandedFrom = Array.from({ length: stopCount }, (_, index) => {
    return fromColors[Math.min(index, fromColors.length - 1)] ?? getLastColor(fromColors);
  });
  const expandedTarget = Array.from({ length: stopCount }, (_, index) => {
    return targetColors[Math.min(index, targetColors.length - 1)] ?? getLastColor(targetColors);
  });

  if (theme.transitionStartAt === 0) {
    theme.colors = [...expandedTarget];
    return theme.colors;
  }

  const progress = Math.min(
    1,
    (timestamp - theme.transitionStartAt) / THEME_FADE_DURATION_MS,
  );
  theme.colors = expandedFrom.map((color, index) => {
    const targetColor =
      expandedTarget[index] ??
      getLastColor(expandedTarget);
    return mixColor(color, targetColor, progress);
  });

  if (progress >= 1) {
    theme.fromColors = [...expandedTarget];
    theme.targetColors = [...expandedTarget];
    theme.transitionStartAt = 0;
  }

  return theme.colors;
}

function getContext(): CanvasRenderingContext2D {
  const context = visualizers.spectrumCanvas.getContext("2d");
  if (!context) throw new Error("2D canvas context is unavailable");
  return context;
}

function resizeCanvas(): void {
  const settings = getVisualizerSettings();
  visualizers.spectrumBar.style.setProperty(
    "--spectrum-max-height",
    `${settings.maxHeightPx}px`,
  );

  const rect = visualizers.spectrumBar.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  visualizers.spectrumCanvas.width = Math.max(
    1,
    Math.floor(rect.width * ratio),
  );
  visualizers.spectrumCanvas.height = Math.max(
    1,
    Math.floor(rect.height * ratio),
  );
}

function ensureAudioGraph(): void {
  if (audioContext) return;

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  applyVisualizerSettings();
  frequencyData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  sourceNode = audioContext.createMediaElementSource(media.music);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
}

function applyVisualizerSettings(): void {
  if (!analyser) {
    return;
  }

  const settings = getVisualizerSettings();
  analyser.fftSize = settings.fftSize;
  analyser.smoothingTimeConstant = settings.smoothing;
  frequencyData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  resizeCanvas();
}

function getFrequencyRange(): { start: number; end: number } {
  if (!analyser || !audioContext) {
    return { start: 0, end: 0 };
  }

  const settings = getVisualizerSettings();
  const nyquist = audioContext.sampleRate / 2;
  const start = Math.max(
    0,
    Math.floor(
      (settings.minFrequencyHz / nyquist) * analyser.frequencyBinCount,
    ),
  );
  const end = Math.min(
    analyser.frequencyBinCount - 1,
    Math.ceil(
      (settings.maxFrequencyHz / nyquist) * analyser.frequencyBinCount,
    ),
  );

  return {
    start,
    end: Math.max(start, end),
  };
}

function drawIdle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
): void {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  const colorStops = normalizeColorStops(colors);

  colorStops.forEach((color, index) => {
    gradient.addColorStop(index / Math.max(1, colorStops.length - 1), color);
  });

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.24;
  ctx.fillRect(0, height - 10, width, 2);
  ctx.globalAlpha = 1;
}

function drawSpectrum(timestamp: number): void {
  animationFrameId = window.requestAnimationFrame(drawSpectrum);

  const ctx = getContext();
  const width = visualizers.spectrumCanvas.width;
  const height = visualizers.spectrumCanvas.height;
  const settings = getVisualizerSettings();
  const animatedColors = getAnimatedThemeColors(timestamp);
  ctx.clearRect(0, 0, width, height);

  if (!analyser || !frequencyData || media.music.paused) {
    drawIdle(ctx, width, height, animatedColors);
    return;
  }

  analyser.getByteFrequencyData(frequencyData);

  const elapsed = lastFrameAt === 0 ? 16.67 : timestamp - lastFrameAt;
  lastFrameAt = timestamp;
  const activity = Math.min(1, Math.max(0.35, elapsed / 16.67));
  const barWidth = width / settings.barCount;
  const centerY = height - 8;
  const maxBarHeight = settings.maxHeightPx;
  const { start, end } = getFrequencyRange();
  const frequencySpan = Math.max(1, end - start);
  const fill = ctx.createLinearGradient(0, 0, width, 0);
  const glow = ctx.createLinearGradient(0, 0, width, 0);
  const stops = normalizeColorStops(animatedColors);

  stops.forEach((color, index) => {
    const stop = index / Math.max(1, stops.length - 1);
    fill.addColorStop(stop, color);
    glow.addColorStop(stop, color);
  });

  for (let i = 0; i < settings.barCount; i += 1) {
    const sampleIndex =
      start + Math.floor((i / settings.barCount) * frequencySpan);
    const raw = (frequencyData[sampleIndex] ?? 0) / 255;
    const eased = Math.pow(raw, 1.45) * activity;
    const barHeight = MIN_BAR_HEIGHT + eased * maxBarHeight;
    const x = i * barWidth;
    const radius = Math.min(barWidth * 0.36, 12);

    ctx.save();
    ctx.fillStyle = fill;
    ctx.shadowBlur = 18;
    ctx.shadowColor =
      animatedColors[
        Math.min(i % animatedColors.length, animatedColors.length - 1)
      ] ??
      getLastColor(animatedColors);
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.roundRect(
      x + barWidth * 0.14,
      centerY - barHeight,
      barWidth * 0.72,
      barHeight,
      radius,
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.16;
  ctx.fillRect(0, height - 18, width, 8);
  ctx.globalAlpha = 1;
}

export function setupSpectrumVisualizer(): void {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  subscribeToSettings(() => {
    applyVisualizerSettings();
  });

  if (!animationFrameId) {
    animationFrameId = window.requestAnimationFrame(drawSpectrum);
  }

  media.music.addEventListener("play", async () => {
    ensureAudioGraph();
    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }
    hasStarted = true;
  });

  media.music.addEventListener("pause", () => {
    lastFrameAt = 0;
  });

  media.music.addEventListener("ended", () => {
    lastFrameAt = 0;
  });
}

export function updateSpectrumTheme(colors: string[]): void {
  const nextColors =
    colors.length > 0
      ? colors.map((color) => hexToRgba(color, 0.85))
      : [...defaultThemeColors];

  theme.fromColors = [...theme.colors];
  theme.targetColors = [...nextColors];
  theme.transitionStartAt = performance.now();

  if (!hasStarted) {
    const ctx = getContext();
    drawIdle(
      ctx,
      visualizers.spectrumCanvas.width,
      visualizers.spectrumCanvas.height,
      getAnimatedThemeColors(performance.now()),
    );
  }
}
