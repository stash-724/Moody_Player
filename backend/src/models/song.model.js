const mongoose = require('mongoose');
const songSchema = new mongoose.Schema({
    title: String,
    artist: String,
    audio: String,
    mood: String,
    // audioFileId:{ type: String }, // ImageKit fileId (optional but useful)}
//   { timestamps: true }
});

module.exports = mongoose.model('song', songSchema);
