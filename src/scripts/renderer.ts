import { state } from './state.ts';

const artistsPanel = document.getElementById('artistsPanel')!;
const partLabel = document.getElementById('partLabel')!;
const lyricsArea = document.getElementById('lyricsArea')!;
const lyricJp = document.getElementById('lyricJp')!;
const lyricRoma = document.getElementById('lyricRoma')!;
const lyricKo = document.getElementById('lyricKo')!;

export function renderArtistPanels(): void {
  artistsPanel.innerHTML = '';

  for (const artist of state.artists) {
    const panel = document.createElement('div');
    panel.className = 'artist-panel';
    panel.dataset.name = artist.name;

    // 이미지 래퍼 (클릭 → 사진 업로드)
    const imgWrap = document.createElement('div');
    imgWrap.className = 'artist-img-wrap' + (artist.imageUrl ? '' : ' no-image');
    imgWrap.style.setProperty('--artist-color', artist.color);
    imgWrap.style.borderColor = artist.color;

    const img = document.createElement('img');
    img.className = 'artist-img';
    img.src = artist.imageUrl ?? '';
    img.alt = artist.name;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      artist.imageUrl = url;
      img.src = url;
      imgWrap.classList.remove('no-image');
      renderCurrentLyric();
    });

    imgWrap.appendChild(img);
    imgWrap.addEventListener('click', () => fileInput.click());
    panel.appendChild(imgWrap);
    panel.appendChild(fileInput);

    // 이름 클릭 → 색상 선택
    const nameRow = document.createElement('div');
    nameRow.className = 'artist-name-row';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'artist-color-input';
    colorInput.value = artist.color;
    colorInput.addEventListener('input', () => {
      artist.color = colorInput.value;
      applyArtistColor(panel, artist.color);
      renderCurrentLyric();
    });

    const nameEl = document.createElement('span');
    nameEl.className = 'artist-name';
    nameEl.textContent = artist.name;
    nameEl.style.color = artist.color;
    nameEl.title = '색상 변경';
    nameEl.appendChild(colorInput);
    nameEl.addEventListener('click', () => colorInput.click());

    nameRow.appendChild(nameEl);
    panel.appendChild(nameRow);

    artistsPanel.appendChild(panel);
  }
}

function applyArtistColor(panel: HTMLElement, color: string): void {
  const imgWrap = panel.querySelector<HTMLElement>('.artist-img-wrap');
  const nameEl = panel.querySelector<HTMLElement>('.artist-name');
  if (imgWrap) {
    imgWrap.style.setProperty('--artist-color', color);
    imgWrap.style.borderColor = color;
  }
  if (nameEl) nameEl.style.color = color;
}

export function renderCurrentLyric(): void {
  const entry = state.resolvedEntries[state.currentIndex];
  if (!entry) return;

  const focused = entry.artist ?? [];

  for (const artist of state.artists) {
    const panel = artistsPanel.querySelector<HTMLElement>(`[data-name="${artist.name}"]`);
    if (!panel) continue;
    const isFocused = focused.includes(artist.name);
    panel.classList.toggle('focused', isFocused);
    panel.classList.toggle('dimmed', !isFocused);
    if (isFocused) panel.style.setProperty('--artist-color', artist.color);
  }

  const lyricColor = getLyricColor(focused);
  lyricJp.style.color = lyricColor;
  lyricKo.style.color = lyricColor;
  lyricRoma.style.color = '';

  lyricsArea.classList.remove('fade');
  void lyricsArea.offsetWidth;
  lyricsArea.classList.add('fade');

  lyricJp.textContent = entry.lines[0];
  lyricRoma.textContent = entry.lines[1];
  lyricKo.textContent = entry.lines[2];

  const newPart = state.rawEntries[state.currentIndex]?.part ?? null;
  if (newPart) {
    partLabel.textContent = newPart;
    partLabel.classList.remove('show');
    void partLabel.offsetWidth;
    partLabel.classList.add('show');
  }
}


function getLyricColor(focused: string[]): string {
  if (focused.length === 1) {
    return state.artists.find((a) => a.name === focused[0])?.color ?? '';
  }
  return '';
}
