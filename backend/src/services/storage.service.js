const ImageKit = require('imagekit');
const mongoose = require('mongoose');

const FOLDER = 'Moody-Player-Songs';

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

// `file` is a Buffer, or a public URL that ImageKit fetches itself.
function upload(file, fileName = new mongoose.Types.ObjectId().toString()) {
  return new Promise((resolve, reject) => {
    getClient().upload({ file, fileName, folder: FOLDER }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

function uploadFile(file) {
  return upload(file.buffer);
}

function uploadFromUrl(url, fileName) {
  return upload(url, fileName);
}

module.exports = uploadFile;
module.exports.uploadFromUrl = uploadFromUrl;
