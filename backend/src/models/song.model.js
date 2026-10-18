const mongoose = require('mongoose');
const MOODS = require('../constants/moods');

const unitInterval = { type: Number, required: true, min: 0, max: 1 };

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    artist: { type: String, required: true, trim: true, maxlength: 200 },
    audio: { type: String, required: true },
    mood: { type: String, required: true, enum: MOODS },
    // Position on the valence/energy plane (0..1 each), used for ranking.
    valence: unitInterval,
    energy: unitInterval,
    // Licensing and attribution, required for CC BY tracks.
    license: { type: String, trim: true },
    licenseUrl: { type: String, trim: true },
    sourceUrl: { type: String, trim: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('song', songSchema);
