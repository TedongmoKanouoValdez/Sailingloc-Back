// reservation.routes.js
const express = require("express");
const {
  createReservationController,
  getReservationsByProprietaire,
  getAllReservations,
  updateReservationStatus,
  getReservationsController,
} = require("../controllers/reservation.controller");

const router = express.Router();
router.post("/", createReservationController);

// Récupérer les réservations d'un utilisateur
router.get("/", getReservationsController);

// GET /reservations/proprietaire/:proprietaireId
router.get("/proprietaire/:proprietaireId", getReservationsByProprietaire);

// route admin
router.get("/admin", getAllReservations);

// PUT update statut propriétaire
router.put("/:id", updateReservationStatus);

module.exports = router;
