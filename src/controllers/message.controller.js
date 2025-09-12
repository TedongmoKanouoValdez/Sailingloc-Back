// auth.js
const prisma = require("../utils/prismaClient");
const service = require("../services/message.service");

/**
 * GET /messages?type=recus|envoyes
 */
exports.getMessagesController = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: "userId est requis dans la query" });
    }
    const type = req.query.type || "recus";
    const skip = Number(req.query.skip) || 0;
    const take = Number(req.query.take) || 20;

    const messages = await service.getMessagesForUser(userId, type, skip, take);
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /messages/:id/lu
 */
exports.markAsReadController = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    const messageId = Number(req.params.id);

    const updated = await service.markMessageAsRead(messageId, userId);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: err.message });
  }
};

/**
 * POST /messages
 */
exports.createMessageController = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    const { destinataireId, contenu, object, reservationId, bateauId } =
      req.body;

    const message = await service.createMessage({
      expediteurId: userId,
      destinataireId,
      contenu,
      object,
      reservationId,
      bateauId,
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /messages/admin - récupérer tous les messages (admin)
exports.getAllMessagesController = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: {
        expediteur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        destinataire: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        bateau: {
          select: { id: true, nom: true },
        },
        reservation: {
          select: { id: true, statut: true },
        },
      },
      orderBy: { creeLe: "desc" },
    });

    res.json({ success: true, messages });
  } catch (err) {
    console.error("❌ Erreur admin messages:", err);
    res.status(500).json({ error: err.message });
  }
};
