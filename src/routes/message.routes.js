const express = require("express");
const {
  getMessagesController,
  markAsReadController,
  createMessageController,
  getAllMessagesController,
} = require("../controllers/message.controller");

const router = express.Router();

// GET /messages?type=recus|envoyes
router.get("/", getMessagesController);

// PATCH /messages/:id/lu
router.patch("/:id/lu", markAsReadController);

// POST /messages
router.post("/", createMessageController);

// route spéciale admin
router.get("/admin", getAllMessagesController);

module.exports = router;
