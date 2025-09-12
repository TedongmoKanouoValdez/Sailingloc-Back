// auth.js
const prisma = require("../utils/prismaClient");

const creerBateauService = async (data) => {
  console.log("Données reçues dans creerBateauService :", data);

  const {
    nom,
    modele,
    port,
    prix,
    description,
    datesIndisponibles,
    disponibilite, // <- nouvelle donnée
    proprietaireId,
    details,
    medias,
  } = data;

  const bateau = await prisma.bateau.create({
    data: {
      nom,
      modele,
      port,
      prix,
      description,
      datesIndisponibles,
      disponibilite, // <- ajout ici
      proprietaire: {
        connect: { id: proprietaireId },
      },
      details: details ? { create: details } : undefined,
      medias: medias && medias.length > 0 ? { create: medias } : undefined,
    },
    include: {
      details: true,
      medias: true,
    },
  });

  return bateau;
};

module.exports = {
  creerBateauService,
};
