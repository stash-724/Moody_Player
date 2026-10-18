const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rankSongs, MOOD_TARGETS } = require('../src/services/recommend.service');
const MOODS = require('../src/constants/moods');

const songs = [
  { title: 'Bright', valence: 0.85, energy: 0.65, mood: 'happy' },
  { title: 'Somber', valence: 0.2, energy: 0.2, mood: 'sad' },
  { title: 'Rage', valence: 0.2, energy: 0.85, mood: 'angry' },
  { title: 'Calm', valence: 0.55, energy: 0.4, mood: 'neutral' },
];

test('every detectable mood has a target inside the unit square', () => {
  for (const mood of MOODS) {
    const t = MOOD_TARGETS[mood];
    assert.ok(t, mood);
    assert.ok(t.valence >= 0 && t.valence <= 1 && t.energy >= 0 && t.energy <= 1, mood);
  }
});

test('ranks the closest song first, regardless of its mood tag', () => {
  assert.deepEqual(rankSongs(songs, 'happy', 4).map((s) => s.title), ['Bright', 'Calm', 'Rage', 'Somber']);
  assert.equal(rankSongs(songs, 'sad', 1)[0].title, 'Somber');
  // No song is tagged "fear"; the nearest one on the plane is returned instead.
  assert.equal(rankSongs(songs, 'fear', 1)[0].title, 'Rage');
});

test('distances are Euclidean, rounded and sorted ascending', () => {
  const ranked = rankSongs(songs, 'neutral', 4);
  assert.equal(ranked[0].distance, 0);
  const d = ranked.map((s) => s.distance);
  assert.deepEqual(d, [...d].sort((a, b) => a - b));
  // happy target (0.85, 0.65) to Calm (0.55, 0.4): hypot(0.3, 0.25) = 0.3905...
  assert.equal(rankSongs(songs, 'happy', 2)[1].distance, 0.391);
});

test('limit caps the result and ties break on title', () => {
  const tied = [{ title: 'B', valence: 0.5, energy: 0.5 }, { title: 'A', valence: 0.5, energy: 0.5 }];
  assert.deepEqual(rankSongs(tied, 'neutral', 2).map((s) => s.title), ['A', 'B']);
  assert.equal(rankSongs(songs, 'happy', 2).length, 2);
});

test('unknown moods throw', () => {
  assert.throws(() => rankSongs(songs, 'sleepy', 3), /Unknown mood/);
});
