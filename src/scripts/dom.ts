function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id "${id}" not found`);
  return element as T;
}

export const dialogs = {
  lyrics: getElement<HTMLDialogElement>("lyricsDialog"),
};

export const inputs = {
  lyricsTextarea: getElement<HTMLTextAreaElement>("lyricsTextarea"),
  backgroundFile: getElement<HTMLInputElement>("bgInput"),
  musicFile: getElement<HTMLInputElement>("musicInput"),
};

export const buttons = {
  applyLyrics: getElement<HTMLButtonElement>("applyLyricsBtn"),
};

export const images = {
  background: getElement<HTMLImageElement>("bgImg"),
};

export const media = {
  music: getElement<HTMLAudioElement>("musicPlayer"),
};

export const visualizers = {
  spectrumBar: getElement<HTMLElement>("spectrumBar"),
  spectrumCanvas: getElement<HTMLCanvasElement>("spectrumCanvas"),
};

export const overlays = {
  background: getElement<HTMLElement>("bgOverlay"),
};

export const sections = {
  artist: getElement<HTMLElement>("artistSection"),
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

export function getArtistPanelElement(
  panel: HTMLElement,
  selector: string,
): HTMLElement | null {
  return panel.querySelector(selector);
}

export function getArtistColorElements(panel: HTMLElement) {
  return {
    imgWrap: getArtistPanelElement(panel, ".artist-img-wrap"),
    nameEl: getArtistPanelElement(panel, ".artist-name"),
  };
}
