const express = require('express');
const multer = require('multer');
const uploadFile = require('../services/storage.service');
const requireAdminKey = require('../middlewares/adminKey.middleware');
const songModel = require('../models/song.model');
const MOODS = require('../constants/moods');
const { rankSongs, MOOD_TARGETS } = require('../services/recommend.service');

const router = express.Router();

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('audio/')),
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Multipart fields arrive as strings; returns a number in [0, 1] or null.
function parseUnit(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

// Admin key is checked before multer so unauthenticated uploads are never buffered.
router.post('/songs', requireAdminKey, upload.single('audio'), async (req, res, next) => {
  try {
    const { title, artist, mood } = req.body || {};
    const valence = parseUnit(req.body?.valence);
    const energy = parseUnit(req.body?.energy);

    const errors = [];
    if (!isNonEmptyString(title)) errors.push('title is required');
    if (!isNonEmptyString(artist)) errors.push('artist is required');
    if (!MOODS.includes(mood)) errors.push(`mood must be one of: ${MOODS.join(', ')}`);
    if (valence === null) errors.push('valence must be a number between 0 and 1');
    if (energy === null) errors.push('energy must be a number between 0 and 1');
    if (!req.file) errors.push('audio file is required (audio/* only)');
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const fileData = await uploadFile(req.file);
    const song = await songModel.create({
      title,
      artist,
      audio: fileData.url,
      mood,
      valence,
      energy,
    });

    res.status(201).json({
      message: 'Song Created Successfully',
      song,
    });
  } catch (err) {
    next(err);
  }
});

// Recommends songs for a mood, ranked by closeness on the valence/energy plane
// instead of requiring an exact mood-tag match.
router.get('/songs', async (req, res, next) => {
  try {
    const { mood } = req.query;
    if (!MOODS.includes(mood)) {
      return res.status(400).json({
        message: `mood query parameter must be one of: ${MOODS.join(', ')}`,
      });
    }
    const limit = req.query.limit === undefined ? DEFAULT_LIMIT : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({ message: `limit must be an integer between 1 and ${MAX_LIMIT}` });
    }

    // The catalogue is small (tens of songs), so ranking in memory is simplest.
    const songs = await songModel
      .find({}, 'title artist audio mood valence energy license licenseUrl sourceUrl')
      .lean();
    res.status(200).json({
      message: 'Songs Retrieved Successfully',
      mood,
      target: MOOD_TARGETS[mood],
      songs: rankSongs(songs, mood, limit),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
