// services/cloudinaryUploadService.js
const fs = require('fs');
const { cloudinary } = require('../utils/cloudinaryConfig');

const uploadToCloudinary = async (localPath) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'bateaux',
    });
    fs.unlinkSync(localPath); // Supprimer le fichier local après upload
    return result.secure_url;
  } catch (err) {
    console.error('Erreur Cloudinary :', err);
    throw err;
  }
};

module.exports = uploadToCloudinary;
