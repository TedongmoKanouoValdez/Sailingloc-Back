const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadRecuController } = require("../controllers/recuController");

const upload = multer({ dest: "uploads/" });

router.post("/upload-recu", upload.single("file"), uploadRecuController);

module.exports = router;
