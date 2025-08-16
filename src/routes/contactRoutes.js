const express = require('express');
const {  handleSendEmail } = require ('../controllers/contactController');


const router = express.Router();

router.post("/send-email", handleSendEmail);

module.exports = router;
