const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "tmp/" });
const { uploadContrat } = require("../controllers/contratController");
const router = express.Router();

router.post("/", upload.single("file"), uploadContrat);

module.exports = router;
