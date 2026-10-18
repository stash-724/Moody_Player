// Builds seed/tracks.json: a small, balanced set of CC BY 4.0 tracks by Kevin MacLeod
// (incompetech.com) with valence/energy values derived from the catalogue metadata.
//
// Valence/energy are a transparent heuristic, not audio analysis or listener ratings:
// each catalogue "feel" tag is placed on Russell's circumplex, a track's valence is the
// mean of its tags' valence, and its energy blends the tags' energy (70%) with tempo (30%).
//
// Usage: node scripts/build-seed-manifest.js
const fs = require('fs');
const path = require('path');
const MOOD_TARGETS = require('../src/constants/moodTargets');

const CATALOG_URL = 'https://incompetech.com/music/royalty-free/pieces.json';
const MP3_BASE = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/';
const PER_MOOD = 4;
const MIN_SECONDS = 90;
const MAX_SECONDS = 300;

const FEEL = {
  Uplifting: [0.9, 0.65], Bright: [0.85, 0.6], Bouncy: [0.8, 0.7], Humorous: [0.8, 0.6],
  Grooving: [0.65, 0.6], Relaxed: [0.6, 0.2], Calming: [0.6, 0.15], Epic: [0.55, 0.85],
  Mystical: [0.5, 0.3], Driving: [0.5, 0.8], Action: [0.45, 0.9], Mysterious: [0.4, 0.4],
  Suspenseful: [0.3, 0.6], Intense: [0.3, 0.85], Eerie: [0.2, 0.45], Unnerving: [0.15, 0.6],
  Dark: [0.15, 0.5], Somber: [0.15, 0.15], Aggressive: [0.15, 0.95],
};

const round2 = (x) => Math.round(x * 100) / 100;
const seconds = (len) => len.split(':').reduce((acc, part) => acc * 60 + Number(part), 0);

function score(piece) {
  const tags = String(piece.feel || '').split(/,\s*/).filter((t) => FEEL[t]);
  if (!tags.length) return null;
  const mean = (i) => tags.reduce((s, t) => s + FEEL[t][i], 0) / tags.length;
  const bpm = Number(piece.bpm);
  const tempo = Number.isFinite(bpm) && bpm > 0 ? Math.min(Math.max((bpm - 60) / 120, 0), 1) : mean(1);
  return { valence: round2(mean(0)), energy: round2(0.7 * mean(1) + 0.3 * tempo), tags };
}

// Variants of one piece (instrumental/extended/"var A" edits, or entries with identical
// tags and tempo) would make the list feel repetitive, so only one per family is kept.
const baseTitle = (t) => t.toLowerCase().replace(/(.*?)|instrumental|var(iation)? w+|version/g, '').replace(/s+/g, ' ').trim();
const signature = (c) => `${[...c.tags].sort().join('|')}@${c.piece.bpm}`;

const distance = (a, b) => Math.hypot(a.valence - b.valence, a.energy - b.energy);

function nearestMood(point) {
  return Object.entries(MOOD_TARGETS).sort((a, b) => distance(point, a[1]) - distance(point, b[1]))[0][0];
}

async function isLive(url) {
  const res = await fetch(url, { method: 'HEAD' });
  return res.ok && Number(res.headers.get('content-length')) > 100000;
}

async function main() {
  const pieces = await (await fetch(CATALOG_URL)).json();
  const candidates = pieces
    .filter((p) => p.filename && /\.mp3$/i.test(p.filename) && p.length)
    .filter((p) => seconds(p.length) >= MIN_SECONDS && seconds(p.length) <= MAX_SECONDS)
    .map((p) => ({ piece: p, ...score(p) }))
    .filter((c) => c.tags);

  const chosen = new Map();
  const seenTitles = new Set();
  const seenSignatures = new Set();
  for (const [mood, target] of Object.entries(MOOD_TARGETS)) {
    const ranked = candidates
      .sort((a, b) => distance(a, target) - distance(b, target) || a.piece.title.localeCompare(b.piece.title));
    let picked = 0;
    for (const c of ranked) {
      if (picked === PER_MOOD) break;
      if (seenTitles.has(baseTitle(c.piece.title)) || seenSignatures.has(signature(c))) continue;
      const url = MP3_BASE + encodeURIComponent(c.piece.filename);
      if (!(await isLive(url))) continue;
      chosen.set(c.piece.filename, { c, url, forMood: mood });
      seenTitles.add(baseTitle(c.piece.title));
      seenSignatures.add(signature(c));
      picked += 1;
    }
  }

  const tracks = [...chosen.values()].map(({ c, url }) => ({
    title: c.piece.title,
    artist: 'Kevin MacLeod',
    mood: nearestMood(c),
    valence: c.valence,
    energy: c.energy,
    feel: c.tags,
    bpm: Number(c.piece.bpm) || null,
    length: c.piece.length,
    sourceUrl: url,
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  }));

  const out = {
    generatedBy: 'scripts/build-seed-manifest.js',
    catalog: CATALOG_URL,
    attribution: 'Music by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0',
    tracks,
  };
  fs.writeFileSync(path.join(__dirname, '..', 'seed', 'tracks.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${tracks.length} tracks from ${candidates.length} candidates`);
  for (const t of tracks) console.log(`${t.mood.padEnd(9)} v=${t.valence.toFixed(2)} e=${t.energy.toFixed(2)}  ${t.title}  [${t.feel.join(', ')}]`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
