const ImageKit = require('imagekit');
const mongoose = require('mongoose');

// Created lazily: ImageKit throws if keys are missing, which would otherwise
// crash the whole server even though only uploads need it.
let imagekit;
function getClient() {
  if (!imagekit) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekit;
}

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    getClient().upload({
      file: file.buffer,
      fileName: new mongoose.Types.ObjectId().toString(),
      folder: 'Moody-Player-Songs',
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

module.exports = uploadFile;
