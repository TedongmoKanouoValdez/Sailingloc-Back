const prisma = require("../utils/prismaClient");

const service = require("../services/demandeProprietaireService");

exports.postDemande = async (req, res) => {
  const { userId, ...payload } = req.body;

  if (!userId || isNaN(Number(userId))) {
    return res.status(401).json({
      message:
        "Vous devez être connecté pour soumettre une demande de partenariat.",
    });
  }
  try {
    const demande = await service.createDemande(Number(userId), payload);
    await service.notifyAdmin(Number(userId), demande.id, payload.nomComplet);
    res.json({ message: "Demande enregistrée avec succès !" });
  } catch (err) {
    if (err.code === "DAILY_LIMIT" || err.code === "WEEKLY_LIMIT") {
      return res.status(409).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
