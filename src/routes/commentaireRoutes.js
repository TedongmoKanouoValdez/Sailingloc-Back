const express = require("express");
const router = express.Router();
const commentaireController = require("../controllers/commentaireController");

router.get("/", commentaireController.getCommentaires);
router.post("/", commentaireController.createCommentaire);

module.exports = router;
