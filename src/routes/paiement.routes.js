const express = require("express");
const router = express.Router();
const {
  createPaiement,
  getAllPaiements,
  getPaiementsProprietaire,
} = require("../services/paiement.service");

router.post("/", async (req, res) => {
  try {
    const paiement = await createPaiement(req.body);
    res.status(201).json({ message: "Paiement enregistré", paiement });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Route pour récupérer tous les paiements (admin)
router.get("/admin", async (req, res) => {
  try {
    const paiements = await getAllPaiements();
    res.status(200).json({ paiements });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Route pour récupérer les paiements du propriétaire
router.get("/proprietaire/:id", async (req, res) => {
  try {
    const proprietaireId = parseInt(req.params.id, 10);
    const paiements = await getPaiementsProprietaire(proprietaireId);
    res.status(200).json({ paiements });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
