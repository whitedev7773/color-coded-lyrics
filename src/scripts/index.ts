import { parseLyrics, extractArtists, resolveArtists } from './parser.ts';
import { state, createArtists } from './state.ts';
import { renderArtistPanels, renderCurrentLyric } from './renderer.ts';

const lyricsDialog = document.getElementById('lyricsDialog') as HTMLDialogElement;
const lyricsTextarea = document.getElementById('lyricsTextarea') as HTMLTextAreaElement;
const applyLyricsBtn = document.getElementById('applyLyricsBtn')!;
const bgImg = document.getElementById('bgImg') as HTMLImageElement;
const bgOverlay = document.getElementById('bgOverlay')!;
const bgInput = document.getElementById('bgInput') as HTMLInputElement;

function blankEntry() { return { part: null, artist: [] as string[], lines: ['\u00A0', '\u00A0', '\u00A0'] as [string, string, string] }; }

function applyLyrics(text: string): void {
  const raw = [blankEntry(), ...parseLyrics(text), blankEntry()];
  const resolved = resolveArtists(raw);
  const artistNames = extractArtists(raw);

  const existingByName = new Map(state.artists.map((a) => [a.name, a]));
  const newArtists = createArtists(artistNames).map((a) => existingByName.get(a.name) ?? a);

  state.rawEntries = raw;
  state.resolvedEntries = resolved;
  state.artists = newArtists;
  state.currentIndex = 0;

  renderArtistPanels();
  renderCurrentLyric();
  lyricsDialog.close();
}

function navigate(delta: number): void {
  const next = state.currentIndex + delta;
  if (next < 0 || next >= state.resolvedEntries.length) return;
  state.currentIndex = next;
  renderCurrentLyric();
}

applyLyricsBtn.addEventListener('click', () => {
  const text = lyricsTextarea.value.trim();
  if (text) applyLyrics(text);
});

bgInput.addEventListener('change', () => {
  const file = bgInput.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  bgImg.src = url;
  bgImg.classList.add('visible');
  bgOverlay.classList.add('visible');
});

document.addEventListener('keydown', (e) => {
  if (lyricsDialog.open) return;
  if (e.key === 'ArrowLeft') navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
  if (e.key === 'e' || e.key === 'E') lyricsDialog.showModal();
  if (e.key === 'b' || e.key === 'B') bgInput.click();
});

lyricsDialog.showModal();
