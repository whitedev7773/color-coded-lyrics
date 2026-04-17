import { parseLyrics, extractArtists, resolveArtists } from './parser.ts';
import { state, createArtists } from './state.ts';
import { renderArtistPanels, renderCurrentLyric } from './renderer.ts';

const lyricsDialog = document.getElementById('lyricsDialog') as HTMLDialogElement;
const lyricsTextarea = document.getElementById('lyricsTextarea') as HTMLTextAreaElement;
const applyLyricsBtn = document.getElementById('applyLyricsBtn')!;

function applyLyrics(text: string): void {
  const raw = parseLyrics(text);
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

document.addEventListener('keydown', (e) => {
  if (lyricsDialog.open) return;
  if (e.key === 'ArrowLeft') navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
  // E 키: 가사 수정 열기
  if (e.key === 'e' || e.key === 'E') lyricsDialog.showModal();
});

lyricsDialog.showModal();
