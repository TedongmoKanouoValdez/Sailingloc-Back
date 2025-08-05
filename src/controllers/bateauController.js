const { creerBateauService } = require("../services/bateauService");
const { validationResult } = require("express-validator");

const creerBateau = async (req, res) => {
  // Validation des champs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const nouveauBateau = await creerBateauService(req.body);
    res.status(201).json(nouveauBateau);
  } catch (error) {
    console.error("Erreur lors de la création du bateau :", error);
    res.status(500).json({ error: "Impossible de créer le bateau." });
  }
};

module.exports = {
  creerBateau,
};
