// Target point on the valence/energy plane for each detected emotion, following
// Russell's circumplex model of affect (valence = unpleasant..pleasant,
// energy = arousal, calm..excited). Both axes run 0..1. Songs are ranked by their
// distance to the target, so a mood without an exact tag match still gets the
// closest-feeling music. These are mood-congruent targets (match the feeling,
// don't try to change it).
const MOOD_TARGETS = {
  happy: { valence: 0.85, energy: 0.65 },
  surprise: { valence: 0.7, energy: 0.85 },
  neutral: { valence: 0.55, energy: 0.4 },
  sad: { valence: 0.2, energy: 0.2 },
  angry: { valence: 0.2, energy: 0.85 },
  fear: { valence: 0.15, energy: 0.65 },
  disgust: { valence: 0.25, energy: 0.5 },
};

module.exports = MOOD_TARGETS;
