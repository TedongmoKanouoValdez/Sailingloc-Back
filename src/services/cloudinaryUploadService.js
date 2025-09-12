// services/cloudinaryUploadService.js
const { cloudinary } = require('../utils/cloudinaryConfig');
const streamifier = require('streamifier');

const uploadToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bateaux',
        public_id: fileName.replace(/\.[^/.]+$/, ""), // retire l'extension si besoin
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

module.exports = uploadToCloudinary;
