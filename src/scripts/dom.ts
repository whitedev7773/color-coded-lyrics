/**
 * DOM 요소 관리 모듈
 * 모든 DOM 선택자를 한 곳에서 관리합니다
 */

function getElement<T extends HTMLElement>(id: string, type?: new () => T): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id "${id}" not found`);
  return element as T;
}

function queryElement<T extends HTMLElement>(
  selector: string,
  type?: new () => T,
): T {
  const element = document.querySelector(selector);
  if (!element)
    throw new Error(`Element with selector "${selector}" not found`);
  return element as T;
}

// 다이얼로그 및 입력 필드
export const dialogs = {
  lyrics: getElement("lyricsDialog", HTMLDialogElement),
};

export const inputs = {
  lyricsTextarea: getElement("lyricsTextarea", HTMLTextAreaElement),
  backgroundFile: getElement("bgInput", HTMLInputElement),
};

export const buttons = {
  applyLyrics: getElement("applyLyricsBtn", HTMLButtonElement),
};

export const images = {
  background: getElement("bgImg", HTMLImageElement),
};

export const overlays = {
  background: getElement("bgOverlay", HTMLElement),
};

export const panels = {
  artists: getElement("artistsPanel", HTMLElement),
  lyrics: getElement("lyricsArea", HTMLElement),
};

export const lyrics = {
  part: getElement("partLabel", HTMLElement),
  jp: getElement("lyricJp", HTMLElement),
  roma: getElement("lyricRoma", HTMLElement),
  ko: getElement("lyricKo", HTMLElement),
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
