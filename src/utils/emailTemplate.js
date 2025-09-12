// src/utils/emailTemplate.js
function resetPasswordTemplate(resetUrl) {
  return `
<div style="
  background:#f7f9fc;
  font-family:'Segoe UI',Arial,sans-serif;
  padding:40px 20px;
  margin:0;
">
  <div style="
    max-width:480px;
    margin:0 auto;
    background:#ffffff;
    border-radius:8px;
    box-shadow:0 4px 12px rgba(0,0,0,.08);
    overflow:hidden;
  ">
    <!-- HEADER -->
    <div style="background:#3682AE;padding:24px 32px;text-align:center;">
        <span style="color:#ffffff;font-weight:bold;font-size:24px;">SAILINGLOC</span>
    </div>

    <!-- BODY -->
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;">
        Réinitialisation de votre mot de passe
      </h2>
      <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.5;">
        Bonjour,<br>
        Cliquez sur le bouton ci-dessous pour changer votre mot de passe. 
      </p>

      <div style="text-align:center;">
        <a href="${resetUrl}" style="
          display:inline-block;
          background:#3682AE;
          color:#ffffff;
          font-size:16px;
          font-weight:600;
          text-decoration:none;
          padding:14px 32px;
          border-radius:4px;
        ">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <p style="margin:32px 0 0;font-size:14px;color:#888;">
        Si vous n’avez pas demandé cette action, ignorez simplement cet e-mail.
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background:#f1f3f5;font-size:12px;color:#666;padding:16px 32px;text-align:center;">
      SailInLoc &copy; 2025 — Tous droits réservés
    </div>
  </div>
</div>
  `;
}

module.exports = { resetPasswordTemplate };
