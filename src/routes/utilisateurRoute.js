const express = require("express");
const upload = require("../middleware/upload");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  getAllUtilisateurs,
  getUtilisateur,
} = require("../controllers/utilisateurController");

const router = express.Router();

router.post(
  "/",
  upload.array("photoProfil", 2),
  (req, res, next) => {
    console.log("Email reçu :", req.body.email);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Photo de profil requise" });
    }
    if (req.files.length > 1) {
      return res
        .status(400)
        .json({ message: "Une seule photo de profil est autorisée" });
    }

    req.file = req.files[0]; // On met le fichier unique dans req.file pour la suite
    next();
  },
  createUtilisateur
);

//utilisateur connecté
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // Récupération depuis le token
    const userId = req.user.userId; // car tu l'as appelé userId dans le jwt

    // Recherche dans la base
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        nom: true,
        prenom: true,
        email: true,
        role: true,
        photoProfil: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur /me :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//route de modification de l'utilisateur
router.put("/:id", upload.single("photoProfil"), updateUtilisateur);

// route pour la suppression d'un utilisateur
router.delete("/:id", deleteUtilisateur);

// affiche les données des utilisateurs
router.get("/", getAllUtilisateurs);

//route pour un utilisateur
router.get("/:id", getUtilisateur);

module.exports = router;
