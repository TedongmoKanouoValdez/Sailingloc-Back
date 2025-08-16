const { PrismaClient, RoleUtilisateur, TypeMedia } = require("@prisma/client");
const {
  validateUtilisateurInput,
} = require("../validation/utilisateurValidation");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const { cloudinary, getPublicIdFromUrl } = require("../utils/cloudinaryConfig");

const fs = require("fs-extra");
const path = require("path");
async function createUserWithPhoto(data, file) {
  const error = validateUtilisateurInput(data);
  if (error) {
    await fs.remove(file.path); // Supprime le fichier si erreur de validation
    throw new Error(error);
  }

  try {
    const hashedPassword = await bcrypt.hash(data.motDePasse, 10);

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "users/profiles",
    });

    const user = await prisma.utilisateur.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        motDePasse: hashedPassword,
        role: data.role,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        photoProfil: result.secure_url,
        medias: {
          create: {
            url: result.secure_url,
            type: TypeMedia.PROFIL,
            titre: "Photo de profil",
          },
        },
      },
    });

    // Si un rôle est fourni et c’est un PROPRIETAIRE, alors on ajoute dans la table proprietaire
    if (data.role && data.role === "PROPRIETAIRE") {
      await prisma.proprietaire.create({
        data: {
          utilisateurId: user.id,
        },
      });
    }

    await fs.remove(file.path);

    const { motDePasse, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (err) {
    await fs.remove(file.path); // supprime le fichier en cas d’erreur aussi
    throw err;
  }
}

async function updateUserWithPhoto(id, data, file) {
  console.log("Mot de passe reçu :", data.motDePasse); // debug ici
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: parseInt(id) },
  });

  if (!utilisateur) {
    throw new Error("Utilisateur non trouvé");
  }

  // 🔹 Hash du mot de passe si modifié
  if (data.motDePasse) {
    const salt = await bcrypt.genSalt(10);
    data.motDePasse = await bcrypt.hash(data.motDePasse, salt);
  }

  if (file) {
    if (utilisateur.photoProfil) {
      const publicId = getPublicIdFromUrl(utilisateur.photoProfil);
      //console.log("Tentative suppression image Cloudinary avec publicId:", publicId);
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Erreur suppression image Cloudinary:", err);
        // Optionnel : gérer l'erreur ou continuer
      }
    }

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "utilisateurs",
      });
      data.photoProfil = result.secure_url;
    } catch (err) {
      console.error("Erreur upload image Cloudinary:", err);
      throw new Error("Impossible d'uploader la nouvelle photo");
    }

    // Supprime le fichier local temporaire
    fs.unlinkSync(file.path);
  }

  // const utilisateurMisAJour = await prisma.utilisateur.update({
  //   where: { id: parseInt(id) },
  //   data,
  // });

  const utilisateurMisAJour = await prisma.utilisateur.update({
    where: { id: parseInt(id) },
    data: {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      role: data.role,
      ...(data.motDePasse && { motDePasse: data.motDePasse }),
      ...(data.photoProfil && { photoProfil: data.photoProfil }),
    },
  });

  return utilisateurMisAJour;
}

async function deleteUserById(id) {
  // Récupérer l'utilisateur
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id },
  });

  if (!utilisateur) {
    throw new Error("Utilisateur non trouvé");
  }

  // Si utilisateur est PROPRIETAIRE, on doit supprimer aussi les bateaux associés
  if (utilisateur.role === "PROPRIETAIRE") {
    // Récupérer l'entrée proprietaire liée à l'utilisateur
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { utilisateurId: id },
    });

    if (proprietaire) {
      // Récupérer les IDs des bateaux du propriétaire
      const bateaux = await prisma.bateau.findMany({
        where: {
          proprietaireId: proprietaire.id,
        },
        select: { id: true },
      });

      const bateauIds = bateaux.map((b) => b.id);

      if (bateauIds.length > 0) {
        // Supprimer les détails liés aux bateaux
        await prisma.detailsBateau.deleteMany({
          where: {
            bateauId: { in: bateauIds },
          },
        });

        // Supprimer les bateaux
        await prisma.bateau.deleteMany({
          where: {
            id: { in: bateauIds },
          },
        });
      }

      // Supprimer l'entrée proprietaire
      await prisma.proprietaire.delete({
        where: {
          id: proprietaire.id,
        },
      });
    }
  }

  // Supprimer la photo sur Cloudinary si elle existe
  if (utilisateur.photoProfil) {
    const publicId = getPublicIdFromUrl(utilisateur.photoProfil);
    await cloudinary.uploader.destroy(publicId);
  }

  // Supprimer l'utilisateur
  await prisma.utilisateur.delete({
    where: { id },
  });
}

// affichage de tous les utilisateurs
async function getAllUtilisateur() {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      include: {
        proprietaire: {
          include: {
            bateaux: true,
          },
        },
      },
    });

    const utilisateursAvecBateaux = utilisateurs.map((u) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone,
      adresse: u.adresse,
      role: u.role,
      photoProfil: u.photoProfil,
      nbbateau: u.proprietaire?.bateaux?.length ?? 0,
    }));

    //console.log("Utilisateurs avec bateaux :", utilisateursAvecBateaux);
    return utilisateursAvecBateaux;
  } catch (error) {
    console.error("Erreur dans getAllUtilisateur:", error);
    throw error;
  }
}

//affichage d'un utilisateur
async function getUtilisateurById(id) {
  return await prisma.utilisateur.findUnique({
    where: { id: Number(id) },
  });
}

module.exports = {
  createUserWithPhoto,
  updateUserWithPhoto,
  deleteUserById,
  getAllUtilisateur,
  getUtilisateurById,
};
