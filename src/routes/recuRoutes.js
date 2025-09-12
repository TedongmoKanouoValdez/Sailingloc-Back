const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadRecuController } = require("../controllers/recuController");

// Stockage en mémoire pour Vercel
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload-recu", upload.single("file"), uploadRecuController);

module.exports = router;
