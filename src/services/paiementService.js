const { EtatPaiement, StatutReservation, Prisma } = require("@prisma/client");
// auth.js
const prisma = require("../utils/prismaClient");

function createAppError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const createPaiement = async (data) => {
  const {
    reservationId,
    montant,
    montantTotal,
    methodePaiement,
    pourcentageStripe,
    etatPaiement, // "PAYE" | "EN_ATTENTE" | "ECHEC"
  } = data;

  // Vérifier la réservation
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      bateau: true, // inclure les données du bateau
      contrat: true, // inclure le contrat
      messages: true, // inclure les messages
    },
  });
  if (!reservation) throw createAppError("Réservation introuvable", 404);

  // Vérifier si un paiement existe déjà
  const existing = await prisma.paiement.findUnique({
    where: { reservationId },
  });
  if (existing)
    throw createAppError(
      "Paiement déjà enregistré pour cette réservation",
      409
    );

  // Vérifier enum
  if (!Object.values(EtatPaiement).includes(etatPaiement)) {
    throw createAppError("etatPaiement invalide", 400);
  }

  // Transaction : créer le paiement + mettre à jour le statut
  const paiement = await prisma.$transaction(async (tx) => {
    const created = await tx.paiement.create({
      data: {
        reservationId,
        montant: new Prisma.Decimal(montant),
        montantTotal: new Prisma.Decimal(montantTotal),
        methodePaiement,
        pourcentageStripe: new Prisma.Decimal(pourcentageStripe),
        etatPaiement,
      },
    });

    // Si PAYE → confirmer la réservation
    if (etatPaiement === EtatPaiement.PAYE) {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { statut: StatutReservation.CONFIRMEE },
      });
    }

    await tx.message.create({
      data: {
        expediteurId: reservation.utilisateurId, // client
        destinataireId: reservation.proprietaireId, // par ex. propriétaire du bateau
        reservationId: reservation.id,
        bateauId: reservation.bateauId,
        contenu: `Le paiement de ${montantTotal} € a été confirmé.`,
        object: "Confirmation de paiement",
        dateEnvoi: new Date(),
      },
    });

    return created;
  });

  return paiement;
};

// Récupérer tous les paiements pour l'admin
const getAllPaiements = async () => {
  const paiements = await prisma.paiement.findMany({
    include: {
      reservation: {
        include: {
          utilisateur: true,
          bateau: true,
        },
      },
    },
  });
  return paiements;
};

// Récupérer les paiements pour un propriétaire spécifique
const getPaiementsProprietaire = async (proprietaireId) => {
  const paiements = await prisma.paiement.findMany({
    include: {
      reservation: {
        include: {
          bateau: true,
          utilisateur: true,
        },
      },
    },
    where: {
      reservation: {
        bateau: {
          proprietaireId: proprietaireId,
        },
      },
    },
  });
  return paiements;
};

module.exports = { createPaiement, getAllPaiements, getPaiementsProprietaire };
