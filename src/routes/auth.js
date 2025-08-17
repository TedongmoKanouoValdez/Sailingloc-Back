const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { RoleUtilisateur } = require("@prisma/client");
const prisma = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET;

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
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
