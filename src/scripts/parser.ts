export interface LyricEntry {
  part: string | null;
  artist: string[] | null;
  lines: [string, string, string];
}

function parseFirstLine(raw: string): { part: string | null; artist: string[] | null; text: string } {
  let rest = raw.trim();
  let part: string | null = null;
  let artist: string[] | null = null;

  const partMatch = rest.match(/^\[([^\]]+)\]\s*/);
  if (partMatch) {
    part = partMatch[1] ?? null;
    rest = rest.slice(partMatch[0].length);
  }

  const artistMatch = rest.match(/^#([^\s]*)\s*/);
  if (artistMatch) {
    const tag = (artistMatch[1] ?? "").trim();
    if (tag === '.' || tag === '') {
      artist = [];
    } else {
      artist = tag.split('+').map((a) => a.trim()).filter(Boolean);
    }
    rest = rest.slice(artistMatch[0].length);
  }

  return { part, artist, text: rest };
}

function dotToNbsp(s: string): string {
  return s.trim() === '.' ? '\u00A0' : s;
}

export function parseLyrics(text: string): LyricEntry[] {
  const groups = text.split(/\n\s*\n/).map((g) => g.trim()).filter(Boolean);
  const entries: LyricEntry[] = [];

  for (const group of groups) {
    const rawLines = group.split('\n').map((l) => l.trim());

    const { part, artist, text: firstText } = parseFirstLine(rawLines[0] ?? "");
    const line0 = dotToNbsp(firstText || '\u00A0');
    const line1 = dotToNbsp(rawLines[1] ?? '');
    const line2 = dotToNbsp(rawLines[2] ?? '');

    entries.push({
      part,
      artist,
      lines: [line0 || '\u00A0', line1 || '\u00A0', line2 || '\u00A0'],
    });
  }

  return entries;
}

export function extractArtists(entries: LyricEntry[]): string[] {
  const seen = new Set<string>();
  for (const e of entries) {
    if (e.artist) {
      for (const a of e.artist) {
        if (a) seen.add(a);
      }
    }
  }
  return Array.from(seen);
}

export function resolveArtists(entries: LyricEntry[]): LyricEntry[] {
  let last: string[] = [];
  return entries.map((e) => {
    if (e.artist !== null) {
      last = e.artist;
      return e;
    }
    return { ...e, artist: last };
  });
}
