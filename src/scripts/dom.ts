/**
 * DOM 요소 관리 모듈
 * 모든 DOM 선택자를 한 곳에서 관리합니다
 */

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id "${id}" not found`);
  return element as T;
}

// 다이얼로그 및 입력 필드
export const dialogs = {
  lyrics: getElement<HTMLDialogElement>("lyricsDialog"),
};

export const inputs = {
  lyricsTextarea: getElement<HTMLTextAreaElement>("lyricsTextarea"),
  backgroundFile: getElement<HTMLInputElement>("bgInput"),
};

export const buttons = {
  applyLyrics: getElement<HTMLButtonElement>("applyLyricsBtn"),
};

export const images = {
  background: getElement<HTMLImageElement>("bgImg"),
};

export const overlays = {
  background: getElement<HTMLElement>("bgOverlay"),
};

export const panels = {
  artists: getElement<HTMLElement>("artistsPanel"),
  lyrics: getElement<HTMLElement>("lyricsArea"),
};

export const lyrics = {
  part: getElement<HTMLElement>("partLabel"),
  jp: getElement<HTMLElement>("lyricJp"),
  roma: getElement<HTMLElement>("lyricRoma"),
  ko: getElement<HTMLElement>("lyricKo"),
};

/**
 * 패널에서 아티스트별 요소를 찾습니다
 */
export function getArtistPanelElement(
  panel: HTMLElement,
  selector: string,
): HTMLElement | null {
  return panel.querySelector(selector);
}

/**
 * 아티스트 패널의 색상 요소들을 찾습니다
 */
export function getArtistColorElements(panel: HTMLElement) {
  return {
    imgWrap: getArtistPanelElement(panel, ".artist-img-wrap"),
    nameEl: getArtistPanelElement(panel, ".artist-name"),
  };
}
