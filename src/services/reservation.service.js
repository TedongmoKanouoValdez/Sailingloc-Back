// reservation.service.js
// auth.js
const prisma = require("../utils/prismaClient");

function createAppError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

const createReservation = async (data) => {
  // 1. Vérifier si l'utilisateur a déjà réservé ce bateau pour ces dates
  const existingReservation = await prisma.reservation.findFirst({
    where: {
      utilisateurId: data.utilisateurId,
      bateauId: data.bateauId,
      // Vérifie s'il y a chevauchement de dates
      OR: [
        {
          dateDebut: { lte: new Date(data.dateFin) },
          dateFin: { gte: new Date(data.dateDebut) },
        },
      ],
    },
  });

  if (existingReservation) {
    throw createAppError(
      "Vous avez déjà une réservation pour ce bateau à ces dates.",
      400
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      utilisateurId: data.utilisateurId,
      bateauId: data.bateauId,
      dateDebut: new Date(data.dateDebut),
      dateFin: new Date(data.dateFin),
      plage: data.plage || null,
      numbreDePassage: data.numbreDePassage || null,
      supplement: data.supplement || null,
      prixDeBase: data.prixDeBase
        ? new Prisma.Decimal(data.prixDeBase)
        : new Prisma.Decimal(0),
      prixSupplementPassagers: data.prixSupplementPassagers
        ? new Prisma.Decimal(data.prixSupplementPassagers)
        : new Prisma.Decimal(0),
      prixOptionsPayantes: data.prixOptionsPayantes
        ? new Prisma.Decimal(data.prixOptionsPayantes)
        : new Prisma.Decimal(0),
      Total: data.Total
        ? new Prisma.Decimal(data.Total)
        : new Prisma.Decimal(0),
      heure: data.heure || null,
      statut: "EN_ATTENTE",
      creeLe: new Date(),
      montantFinal:
        new Prisma.Decimal(data.montantFinal) || new Prisma.Decimal(0),
      commission: new Prisma.Decimal(data.commission) || new Prisma.Decimal(0),
    },
  });

  const bateau = await prisma.bateau.findUnique({
    where: { id: data.bateauId },
    include: { proprietaire: true }, // relation "proprietaire"
  });

  // Si le bateau n'existe pas, on stoppe
  if (!bateau) {
    throw createAppError("Impossible de récupérer le bateau !", 404);
  }

  // destinataireId = id du propriétaire ou null si absent
  const destinataireId = bateau.proprietaire?.id || null;

  await prisma.message.create({
    data: {
      expediteurId: data.utilisateurId,
      destinataireId,
      reservationId: reservation.id,
      contenu: `Votre réservation du bateau "${data.bateaunom}" du ${formatDate(
        data.dateDebut
      )} au ${formatDate(
        data.dateFin
      )} a bien été enregistrée. Veuillez procéder au paiement pour la confirmer.`,
      object: `Confirmation de réservation - ${data.bateaunom}`,
      dateEnvoi: new Date(),
    },
  });

  return reservation;
};

// Récupérer toutes les réservations d'un utilisateur
const getReservationsForUser = async (utilisateurId) => {
  if (!utilisateurId) throw new Error("utilisateurId est requis");

  return prisma.reservation.findMany({
    where: { utilisateurId },
    include: {
      bateau: {
        select: { id: true, nom: true, proprietaireId: true },
      },
      utilisateur: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
    },
    orderBy: { dateDebut: "desc" },
  });
};

module.exports = { createReservation, getReservationsForUser };
