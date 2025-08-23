var ImageKit = require("imagekit");
var mongoose = require('mongoose');
var imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT,
});

function uploadFile(file){
  return new Promise((resolve, reject) =>{
    imagekit.upload({
      file: file.buffer,
      fileName:new mongoose.Types.ObjectId().toString(),
      folder:"Moody-Player-Songs"
    },(error, result) =>{
      if(error) return reject(error);
      else resolve(result);
    })
  });
}
module.exports = uploadFile;