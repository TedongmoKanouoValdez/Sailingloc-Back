const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // <- ajoute en haut de auth.js
const { sendMail } = require("../utils/mailer");
const { resetPasswordTemplate } = require("../utils/emailTemplate");
const { RoleUtilisateur } = require("@prisma/client");

// auth.js
const prisma = require("../utils/prismaClient");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Regex et fonctions de validation
const unsafePattern = /[<>{}$;]/;
const emailRegex =
  /^(?!.*\.\.)(?!.*[<>])(?!.*\.$)(?!^\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/;
const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

function hasNoDangerousChars(input) {
  return typeof input === "string" && !unsafePattern.test(input);
}

// Fonction dédiée de validation pour l'inscription
function validateRegisterInput({ nom, prenom, email, password }) {
  if (!nom || !prenom || !email || !password) {
    return "Nom, prénom, email et mot de passe sont requis";
  }
  if (!hasNoDangerousChars(nom) || !nameRegex.test(nom)) {
    return "Nom invalide. Lettres uniquement sans caractères spéciaux dangereux.";
  }
  if (!hasNoDangerousChars(prenom) || !nameRegex.test(prenom)) {
    return "Prénom invalide. Lettres uniquement sans caractères spéciaux dangereux.";
  }
  // dans ta validation email :
  if (!hasNoDangerousChars(email) || !emailRegex.test(email)) {
    return "Email invalide ou dangereux";
  }
  if (!passwordRegex.test(password)) {
    return "Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial";
  }
  return null;
}

// Route POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    // Validation via la fonction dédiée
    const error = validateRegisterInput({ nom, prenom, email, password });
    if (error) {
      return res.status(400).json({ message: error });
    }

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await prisma.utilisateur.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    // Détermine le rôle (client par défaut si invalide)
    const validRoles = Object.values(RoleUtilisateur);
    const userRole = validRoles.includes(role) ? role : RoleUtilisateur.CLIENT;

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const user = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        role: userRole,
      },
    });

    // Supprime le mot de passe de la réponse
    const { motDePasse, ...userWithoutPassword } = user;

    res
      .status(201)
      .json({ message: "Utilisateur créé", user: userWithoutPassword });
  } catch (error) {
    console.error("Erreur lors de l’inscription :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Fonction pour vérifier les caractères dangereux dans login
function isSafeInput(input) {
  const forbiddenChars = /[<>"'`;(){}]/;
  return !forbiddenChars.test(input);
}

// Route POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // Vérifie la présence des champs
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  // Validation email et sécurité des inputs
  if (!isSafeInput(email) || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Email invalide ou dangereux" });
  }

  if (!isSafeInput(password)) {
    return res
      .status(400)
      .json({ message: "Mot de passe contient des caractères non autorisés" });
  }

  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
    const validPassword = await bcrypt.compare(password, user.motDePasse);

    if (!validPassword) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        photoProfil: user.photoProfil,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // refresh token plus long, secret différent
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        photoProfil: user.photoProfil,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // token longue durée
    );

    // tu peux stocker le refresh token en DB pour le révoquer si besoin
    const existing = await prisma.refreshToken.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      await prisma.refreshToken.update({
        where: { id: existing.id },
        data: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    res.json({ token, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email || !isSafeInput(email) || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Email invalide" });
  }

  const user = await prisma.utilisateur.findUnique({ where: { email } });
  if (!user) {
    return res.json({ message: "Si l’email existe, un lien a été envoyé." });
  }

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const resetUrl = `https://dsp-dev-o23-g1.vercel.app/resetpassword/${token}`;
  console.log("Reset URL (DEV) :", resetUrl);

  try {
    await sendMail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: resetPasswordTemplate(resetUrl),
    });

    res.json({ message: "Email envoyé avec success!!!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l’envoi de l’email" });
  }
});
// Route : /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token et nouveau mot de passe requis" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.utilisateur.update({
      where: { email },
      data: { motDePasse: hashedPassword },
    });

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré" });
    }
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token manquant" });

  try {
    // Vérifier le refresh token en DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!storedToken)
      return res.status(403).json({ message: "Token invalide" });

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Token invalide ou expiré" });
  }
});

module.exports = router;
