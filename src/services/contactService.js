const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


async function sendEmail(userEmail, link, userMessage) {
  // 📩 Envoi à l’admin
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Nouveau message de contact',
    html: `
      <p><strong>De :</strong> ${userEmail}</p>
      ${link ? `<p><strong>Lien :</strong> <a href="${link}">${link}</a></p>` : ""}
      ${userMessage ? `<p><strong>Message :</strong><br>${userMessage}</p>` : ""}
    `,
  });

  // ✅ Confirmation à l'utilisateur
  await transporter.sendMail({
    from: `SailingLoc <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Confirmation de réception',
    html: `
      <p>Bonjour,</p>
      <p>Nous avons bien reçu votre message.</p>
      <p>Un membre de notre équipe vous répondra dans les plus brefs délais.</p>
      <p>Merci,<br />L’équipe SailingLoc</p>
    `,
  });
}

module.exports = {
  sendEmail,
};
