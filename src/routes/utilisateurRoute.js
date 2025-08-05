const express = require('express');
const upload = require('../middleware/upload');
const { createUtilisateur } = require('../controllers/utilisateurController');

const router = express.Router();

router.post('/', upload.array('photoProfil', 2), (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Photo de profil requise' });
  }
  if (req.files.length > 1) {
    return res.status(400).json({ message: 'Une seule photo de profil est autorisée' });
  }

  req.file = req.files[0];  // On met le fichier unique dans req.file pour la suite
  next();
}, createUtilisateur);

module.exports = router;
