const express = require("express");
const multer = require("multer");
const { uploadContrat } = require("../controllers/contratController");

const storage = multer.memoryStorage(); // ← plus d'écriture disque
const upload = multer({ storage });

const router = express.Router();

router.post("/", upload.single("file"), uploadContrat);

module.exports = router;
