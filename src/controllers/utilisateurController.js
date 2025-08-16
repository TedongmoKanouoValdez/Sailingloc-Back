const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  createUserWithPhoto,
  updateUserWithPhoto,
  deleteUserById,
  getAllUtilisateur,
  getUtilisateurById,
} = require("../services/utilisateurService");

async function createUtilisateur(req, res) {
  try {
    const data = req.body;
    console.log("Email cherché :", data.email);
    if (data.email) {
      data.email = data.email.trim().toLowerCase();
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Photo de profil requise" });
    }

    // Vérifier si email existe déjà avec Prisma
    const utilisateurExiste = await prisma.utilisateur.findUnique({
      where: { email: data.email },
    });
    console.log("Utilisateur trouvé avec cet email :", utilisateurExiste);

    if (utilisateurExiste) {
      return res.status(409).json({ message: "Cet email est déjà utilisé" });
    }

    // Si email ok, créer utilisateur (à adapter selon ta fonction)
    const utilisateur = await createUserWithPhoto(data, file);

    res.status(201).json({
      message: "Utilisateur créé",
      utilisateur,
    });
  } catch (error) {
    // Gestion d’erreur Prisma pour contrainte unique
    if (error.code === "P2002") {
      if (error.meta && error.meta.target.includes("email")) {
        return res.status(409).json({ message: "Cet email est déjà utilisé" });
      }
      if (error.meta && error.meta.target.includes("telephone")) {
        return res
          .status(409)
          .json({ message: "Ce numéro de téléphone est déjà utilisé" });
      }
      return res.status(409).json({ message: "Conflit de données uniques" });
    }
    console.error(error);
    res.status(500).json({
      message: error.message || "Erreur lors de la création de l'utilisateur",
    });
  }
}

async function updateUtilisateur(req, res) {
  try {
    const id = req.params.id;
    const data = req.body;
    const file = req.file;

    const utilisateur = await updateUserWithPhoto(id, data, file);

    res.status(200).json({
      message: "Utilisateur mis à jour",
      utilisateur,
    });
  } catch (error) {
    if (error.code === "P2002") {
      if (error.meta?.target?.includes("email")) {
        return res.status(409).json({ message: "Cet email est déjà utilisé" });
      }
      if (error.meta?.target?.includes("telephone")) {
        return res
          .status(409)
          .json({ message: "Ce numéro de téléphone est déjà utilisé" });
      }
      return res.status(409).json({ message: "Conflit de données uniques" });
    }

    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
}

const deleteUtilisateur = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // car c'est un int en base
    await deleteUserById(id); //  Appel de la vraie suppression
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression utilisateur :", error);
    res.status(500).json({ message: error.message });
  }
};

async function getAllUtilisateurs(req, res) {
  try {
    const utilisateurs = await getAllUtilisateur();
    res.json({ utilisateurs });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des utilisateurs.",
    });
  }
}

async function getUtilisateur(req, res) {
  try {
    const id = req.params.id;
    const utilisateur = await getUtilisateurById(id);

    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(utilisateur);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de l'utilisateur.",
    });
  }
}

module.exports = {
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  getAllUtilisateurs,
  getUtilisateur,
};
