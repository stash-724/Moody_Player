const MOOD_TARGETS = require('../constants/moodTargets');

const round3 = (x) => Math.round(x * 1000) / 1000;

// Ranks songs by Euclidean distance between their (valence, energy) point and the
// mood's target point, closest first. Ties break on title so results are stable.
function rankSongs(songs, mood, limit) {
  const target = MOOD_TARGETS[mood];
  if (!target) throw new Error(`Unknown mood: ${mood}`);
  return songs
    .map((song) => ({
      ...song,
      distance: round3(Math.hypot(song.valence - target.valence, song.energy - target.energy)),
    }))
    .sort((a, b) => a.distance - b.distance || a.title.localeCompare(b.title))
    .slice(0, limit);
}

module.exports = { rankSongs, MOOD_TARGETS };
