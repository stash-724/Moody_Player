const mongoose = require('mongoose');
const MOODS = require('../constants/moods');

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    artist: { type: String, required: true, trim: true, maxlength: 200 },
    audio: { type: String, required: true },
    mood: { type: String, required: true, enum: MOODS },
  },
  { timestamps: true }
);

module.exports = mongoose.model('song', songSchema);
