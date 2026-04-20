import type { Artist } from "./state.ts";
import { state } from "./state.ts";
import { panels, lyrics, sections, getArtistColorElements } from "./dom.ts";
import { CSS_CLASSES, DATA_ATTRIBUTES } from "./constants.ts";
import { toggleClasses } from "./utils.ts";
import { updateSpectrumTheme } from "./visualizer.ts";

function createColorInput(
  artist: Artist,
  onColorChange: (color: string) => void,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "color";
  input.className = CSS_CLASSES.ARTIST_COLOR_INPUT;
  input.value = artist.color;
  input.addEventListener("input", () => {
    artist.color = input.value;
    onColorChange(input.value);
  });
  return input;
}

function createImageFileInput(
  artist: Artist,
  img: HTMLImageElement,
  imgWrap: HTMLElement,
  onImageChange: () => void,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    artist.imageUrl = url;
    img.src = url;
    imgWrap.classList.remove(CSS_CLASSES.NO_IMAGE);
    onImageChange();
  });
  return input;
}

function createImagePanel(
  artist: Artist,
  onImageChange: () => void,
): { wrapper: HTMLElement; fileInput: HTMLInputElement } {
  const imgWrap = document.createElement("div");
  imgWrap.className =
    CSS_CLASSES.ARTIST_IMG_WRAP +
    (artist.imageUrl ? "" : ` ${CSS_CLASSES.NO_IMAGE}`);
  imgWrap.style.setProperty("--artist-color", artist.color);
  imgWrap.style.borderColor = artist.color;

  const img = document.createElement("img");
  img.className = CSS_CLASSES.ARTIST_IMG;
  img.src = artist.imageUrl ?? "";
  img.alt = artist.name;

  const fileInput = createImageFileInput(artist, img, imgWrap, onImageChange);

  imgWrap.appendChild(img);
  imgWrap.addEventListener("click", () => fileInput.click());

  return { wrapper: imgWrap, fileInput };
}

function createNameRow(
  artist: Artist,
  onColorChange: (color: string) => void,
): HTMLElement {
  const nameRow = document.createElement("div");
  nameRow.className = CSS_CLASSES.ARTIST_NAME_ROW;

  const colorInput = createColorInput(artist, onColorChange);

  const nameEl = document.createElement("span");
  nameEl.className = CSS_CLASSES.ARTIST_NAME;
  nameEl.textContent = artist.name;
  nameEl.style.color = artist.color;
  nameEl.title = "Change artist color";
  nameEl.appendChild(colorInput);
  nameEl.addEventListener("click", () => colorInput.click());

  nameRow.appendChild(nameEl);
  return nameRow;
}

function applyArtistColor(panel: HTMLElement, color: string): void {
  const elements = getArtistColorElements(panel);
  if (elements.imgWrap) {
    elements.imgWrap.style.setProperty("--artist-color", color);
    elements.imgWrap.style.borderColor = color;
  }
  if (elements.nameEl) elements.nameEl.style.color = color;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getFocusedColors(focused: string[]): string[] {
  return focused
    .map((name) => state.artists.find((a) => a.name === name)?.color ?? "")
    .filter(Boolean);
}

function applyTextColor(el: HTMLElement, colors: string[], alpha = 1): void {
  const reset = () => {
    el.style.color = "";
    el.style.background = "";
    el.style.backgroundClip = "";
    (el.style as CSSStyleDeclaration & Record<string, string>)["-webkit-background-clip"] = "";
    (el.style as CSSStyleDeclaration & Record<string, string>)["-webkit-text-fill-color"] = "";
  };

  if (colors.length === 0) {
    reset();
    return;
  }

  const stops = colors.map((color) => (alpha < 1 ? hexToRgba(color, alpha) : color));

  if (stops.length === 1) {
    reset();
    el.style.color = stops[0];
  } else {
    el.style.color = "transparent";
    el.style.background = `linear-gradient(to right, ${stops.join(", ")})`;
    el.style.backgroundClip = "text";
    (el.style as CSSStyleDeclaration & Record<string, string>)["-webkit-background-clip"] = "text";
    (el.style as CSSStyleDeclaration & Record<string, string>)["-webkit-text-fill-color"] = "transparent";
  }
}

function isBlankLyricLine(line: string): boolean {
  return line.replace(/\u00A0/g, " ").trim().length === 0;
}

function isBlankLyricEntry(lines: [string, string, string]): boolean {
  return lines.every(isBlankLyricLine);
}

export function renderArtistPanels(): void {
  panels.artists.innerHTML = "";

  for (const artist of state.artists) {
    const panel = document.createElement("div");
    panel.className = CSS_CLASSES.ARTIST_PANEL;
    panel.dataset[DATA_ATTRIBUTES.ARTIST_NAME] = artist.name;

    const onColorChange = (color: string) => {
      applyArtistColor(panel, color);
      renderCurrentLyric();
    };

    const onImageChange = () => {
      renderCurrentLyric();
    };

    const { wrapper: imgWrapper, fileInput } = createImagePanel(
      artist,
      onImageChange,
    );
    panel.appendChild(imgWrapper);
    panel.appendChild(fileInput);

    const nameRow = createNameRow(artist, onColorChange);
    panel.appendChild(nameRow);

    panels.artists.appendChild(panel);
  }
}

export function renderCurrentLyric(): void {
  const entry = state.resolvedEntries[state.currentIndex];
  if (!entry) return;

  const focused = entry.artist ?? [];
  const isBlankEntry = isBlankLyricEntry(entry.lines);
  document.body.classList.toggle("is-blank-lyric", isBlankEntry);

  for (const artist of state.artists) {
    const panel = panels.artists.querySelector<HTMLElement>(
      `[data-${DATA_ATTRIBUTES.ARTIST_NAME}="${artist.name}"]`,
    );
    if (!panel) continue;

    const isFocused = focused.includes(artist.name);
    toggleClasses(panel, {
      [CSS_CLASSES.FOCUSED]: isFocused,
      [CSS_CLASSES.DIMMED]: !isFocused,
    });

    if (isFocused) panel.style.setProperty("--artist-color", artist.color);
  }

  const focusedColors = getFocusedColors(focused);
  const shadowColor = focusedColors.length > 0
    ? `color-mix(in srgb, ${focusedColors[0]} 35%, transparent)`
    : "rgba(0,0,0,0.1)";
  sections.artist.style.boxShadow = `4px 4px 16px ${shadowColor}`;

  applyTextColor(lyrics.ko, focusedColors);
  applyTextColor(lyrics.jp, focusedColors, 0.6);
  applyTextColor(lyrics.roma, focusedColors, 0.6);
  updateSpectrumTheme(focusedColors);

  const newPart = state.rawEntries[state.currentIndex]?.part ?? null;
  if (newPart) {
    lyrics.part.textContent = newPart;
    lyrics.part.classList.remove("show");
    void lyrics.part.offsetWidth;
    lyrics.part.classList.add("show");
  }

  const lyricPanel = panels.lyrics;
  lyricPanel.classList.remove("fade-in", "fade-out");
  void lyricPanel.offsetWidth;
  lyricPanel.classList.add("fade-out");

  setTimeout(() => {
    lyrics.jp.textContent = entry.lines[0];
    lyrics.roma.textContent = entry.lines[1];
    lyrics.ko.textContent = entry.lines[2];
    lyricPanel.classList.remove("fade-out");
    void lyricPanel.offsetWidth;
    lyricPanel.classList.add("fade-in");
  }, 150);
}
