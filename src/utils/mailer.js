// src/utils/mailer.js
const nodemailer = require('nodemailer');

// Configuration unique du transporteur
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * sendMail({ to, subject, html })
 * Retourne une Promise => await sendMail(...)
 */
async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"SailingLoc" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };