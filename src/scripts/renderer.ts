import type { Artist } from "./state.ts";
import { state } from "./state.ts";
import { panels, lyrics, getArtistColorElements } from "./dom.ts";
import { CSS_CLASSES, DATA_ATTRIBUTES } from "./constants.ts";
import { toggleClasses } from "./utils.ts";

/**
 * 색상 입력 필드를 생성합니다
 */
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

/**
 * 이미지 업로드 입력 필드를 생성합니다
 */
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

/**
 * 아티스트 이미지 패널을 생성합니다
 */
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

/**
 * 아티스트 이름 행을 생성합니다
 */
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
  nameEl.title = "색상 변경";
  nameEl.appendChild(colorInput);
  nameEl.addEventListener("click", () => colorInput.click());

  nameRow.appendChild(nameEl);
  return nameRow;
}

/**
 * 아티스트 색상을 적용합니다
 */
function applyArtistColor(panel: HTMLElement, color: string): void {
  const elements = getArtistColorElements(panel);
  if (elements.imgWrap) {
    elements.imgWrap.style.setProperty("--artist-color", color);
    elements.imgWrap.style.borderColor = color;
  }
  if (elements.nameEl) elements.nameEl.style.color = color;
}

/**
 * RGB 색상을 RGBA로 변환합니다 (불투명도 조절)
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 포커스된 아티스트들의 색상 배열을 반환합니다
 */
function getFocusedColors(focused: string[]): string[] {
  return focused
    .map((name) => state.artists.find((a) => a.name === name)?.color ?? "")
    .filter(Boolean);
}

/**
 * 요소에 단색 또는 그라데이션 텍스트 색상을 적용합니다
 */
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

  const stops = colors.map((c) => (alpha < 1 ? hexToRgba(c, alpha) : c));

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

/**
 * 아티스트 패널을 렌더링합니다
 */
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

    // 이미지 패널
    const { wrapper: imgWrapper, fileInput } = createImagePanel(
      artist,
      onImageChange,
    );
    panel.appendChild(imgWrapper);
    panel.appendChild(fileInput);

    // 이름 행
    const nameRow = createNameRow(artist, onColorChange);
    panel.appendChild(nameRow);

    panels.artists.appendChild(panel);
  }
}

/**
 * 현재 가사를 렌더링합니다
 */
export function renderCurrentLyric(): void {
  const entry = state.resolvedEntries[state.currentIndex];
  if (!entry) return;

  const focused = entry.artist ?? [];

  // 아티스트 패널 업데이트
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

  // 가사 색상 설정
  const colors = getFocusedColors(focused);
  applyTextColor(lyrics.ko, colors);
  applyTextColor(lyrics.jp, colors, 0.6);
  applyTextColor(lyrics.roma, colors, 0.6);

  // 페이드 효과
  panels.lyrics.classList.remove("fade");
  void panels.lyrics.offsetWidth; // 리플로우 강제
  panels.lyrics.classList.add("fade");

  // 가사 업데이트
  lyrics.jp.textContent = entry.lines[0];
  lyrics.roma.textContent = entry.lines[1];
  lyrics.ko.textContent = entry.lines[2];

  // 파트 레이블 업데이트
  const newPart = state.rawEntries[state.currentIndex]?.part ?? null;
  if (newPart) {
    lyrics.part.textContent = newPart;
    lyrics.part.classList.remove("show");
    void lyrics.part.offsetWidth; // 리플로우 강제
    lyrics.part.classList.add("show");
  }
}
