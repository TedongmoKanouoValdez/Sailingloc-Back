const { PrismaClient, RoleUtilisateur, TypeMedia  } = require('@prisma/client');
const { validateUtilisateurInput } = require('../validation/utilisateurValidation');
const prisma = new PrismaClient();

const bcrypt = require('bcrypt');
const cloudinary = require('../utils/cloudinaryConfig');

const fs = require('fs-extra');
async function createUserWithPhoto(data, file) {
  const error = validateUtilisateurInput(data);
  if (error) {
    await fs.remove(file.path);  // Supprime le fichier si erreur de validation
    throw new Error(error);
  }

  try {
    const hashedPassword = await bcrypt.hash(data.motDePasse, 10);

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'users/profiles',
    });

    const user = await prisma.utilisateur.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        motDePasse: hashedPassword,
        role: data.role ? data.role : RoleUtilisateur.PROPRIETAIRE,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        photoProfil: result.secure_url,
        medias: {
          create: {
            url: result.secure_url,
            type: TypeMedia.PROFIL,
            titre: 'Photo de profil'
          }
        }
      },
    });

    await fs.remove(file.path);

    const { motDePasse, ...userWithoutPassword } = user;
    return userWithoutPassword;

  } catch (err) {
    await fs.remove(file.path); // supprime le fichier en cas d’erreur aussi
    throw err;
  }
}


module.exports = {
  createUserWithPhoto,
};
