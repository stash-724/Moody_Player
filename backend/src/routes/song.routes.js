const express = require('express');
const multer = require('multer');
const uploadFile = require('../services/storage.service');
const requireAdminKey = require('../middlewares/adminKey.middleware');
const songModel = require('../models/song.model');
const MOODS = require('../constants/moods');

const router = express.Router();

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('audio/')),
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Admin key is checked before multer so unauthenticated uploads are never buffered.
router.post('/songs', requireAdminKey, upload.single('audio'), async (req, res, next) => {
  try {
    const { title, artist, mood } = req.body || {};

    const errors = [];
    if (!isNonEmptyString(title)) errors.push('title is required');
    if (!isNonEmptyString(artist)) errors.push('artist is required');
    if (!MOODS.includes(mood)) errors.push(`mood must be one of: ${MOODS.join(', ')}`);
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
    });

    res.status(201).json({
      message: 'Song Created Successfully',
      song,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/songs', async (req, res, next) => {
  try {
    const { mood } = req.query;
    if (!MOODS.includes(mood)) {
      return res.status(400).json({
        message: `mood query parameter must be one of: ${MOODS.join(', ')}`,
      });
    }

    const songs = await songModel.find({ mood }).select('title artist audio mood').lean();
    res.status(200).json({
      message: 'Songs Retrieved Successfully',
      songs,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
