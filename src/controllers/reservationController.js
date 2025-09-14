// reservation.controller.js
const prisma = require("../utils/prismaClient");
const reservationService = require("../services/reservationService");
const { cleanString } = require("../utils/clean");

// --- création réservation ---
const createReservationController = async (req, res) => {
  try {
    const data = req.body;
    const reservation = await reservationService.createReservation(data);
    res.status(201).json({ message: "Réservation créée", reservation });
  } catch (error) {
    console.error(error);
    const status = error.statusCode || 500;
    const message = error.message || "Erreur lors de la création de la réservation";
    res.status(status).json({ error: message });
  }
};

// --- récup réservations par propriétaire ---
const getReservationsByProprietaire = async (req, res) => {
  const { proprietaireId } = req.params;
  if (!proprietaireId) return res.status(400).json({ error: "proprietaireId est requis" });

  try {
    const reservations = await prisma.reservation.findMany({
      where: { bateau: { proprietaireId: parseInt(proprietaireId) } },
      include: {
        bateau: { include: { medias: true } },
        utilisateur: true,
        contrat: { include: { medias: true } },
        paiement: { include: { recu: { include: { media: true } } } },
      },
      orderBy: { creeLe: "desc" },
    });

    // nettoyer toutes les chaînes
    const cleaned = reservations.map(r => ({
      ...r,
      data: cleanString(r.data),
    }));

    res.json({ success: true, reservations: cleaned });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({ error: "Erreur lors de la récupération des réservations du propriétaire", message: error?.message });
  }
};

// --- récup toutes réservations (admin) ---
const getAllReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
        bateau: { include: { medias: true, proprietaire: { select: { id: true, nom: true, prenom: true, email: true } } } },
        contrat: { include: { medias: true } },
        paiement: { include: { recu: { include: { media: true } } } },
      },
      orderBy: { creeLe: "desc" },
    });

    const cleaned = reservations.map(r => ({
      ...r,
      data: cleanString(r.data),
    }));

    res.json({ success: true, reservations: cleaned });
  } catch (error) {
    console.error("❌ Erreur admin reservations:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// --- mise à jour statut propriétaire + message ---
const updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { statusduproprietaire, expediteurId } = req.body;

  if (!id || !statusduproprietaire || !expediteurId) {
    return res.status(400).json({ error: "id, statusduproprietaire et expediteurId sont requis" });
  }

  try {
    const reservation = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { data: cleanString(statusduproprietaire) },
      include: { utilisateur: true, bateau: true },
    });

    const message = await prisma.message.create({
      data: {
        expediteurId: parseInt(expediteurId),
        destinataireId: reservation.utilisateurId,
        reservationId: reservation.id,
        bateauId: reservation.bateauId,
        contenu: `Le statut de votre réservation a été mis à jour : ${cleanString(statusduproprietaire)}`,
        object: "Mise à jour réservation",
        dateEnvoi: new Date(),
      },
    });

    res.json({ success: true, reservation, message });
  } catch (error) {
    console.error("❌ Erreur updateReservationStatus :", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut et création du message" });
  }
};

// --- récup réservations par utilisateur ---
const getReservationsController = async (req, res) => {
  try {
    const utilisateurId = parseInt(req.query.userId);
    if (!utilisateurId) return res.status(400).json({ error: "userId est requis" });

    const reservations = await reservationService.getReservationsForUser(utilisateurId);
    res.json({ success: true, reservations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createReservationController,
  getReservationsByProprietaire,
  getAllReservations,
  updateReservationStatus,
  getReservationsController,
};
