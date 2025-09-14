// auth.js
const prisma = require("../utils/prismaClient");
const service = require("../services/messageService");

// fonction utilitaire pour nettoyer les chaînes de caractères
function cleanString(str) {
  if (typeof str !== "string") return str;
  // supprime null bytes et caractères non UTF-8
  return str.replace(/\0/g, "");
}

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

    const whereClause =
      type === "envoyes"
        ? { expediteurId: userId }
        : { destinataireId: userId };

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        expediteur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        destinataire: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
      orderBy: { creeLe: "desc" },
      skip,
      take,
    });

    // nettoyer toutes les chaînes pour éviter UTF8 errors
    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      contenu: cleanString(msg.contenu),
      object: cleanString(msg.object),
    }));

    res.json({ messages: cleanedMessages });
  } catch (err) {
    console.error("Erreur getMessagesController:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * GET /messages/admin - récupérer tous les messages (admin)
 */
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
        bateau: { select: { id: true, nom: true } },
        reservation: { select: { id: true, statut: true } },
      },
      orderBy: { creeLe: "desc" },
    });

    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      contenu: cleanString(msg.contenu),
      object: cleanString(msg.object),
    }));

    res.json({ success: true, messages: cleanedMessages });
  } catch (err) {
    console.error("❌ Erreur admin messages:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
