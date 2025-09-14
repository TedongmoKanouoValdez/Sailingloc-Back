// auth.js
const prisma = require("../utils/prismaClient");

// Récupérer les messages d'un utilisateur
async function getMessagesForUser(userId, type = "recus", skip = 0, take = 20) {
  if (!userId) throw new Error("userId est requis");

  return prisma.message.findMany({
    where: {
      OR: [
        { destinataireId: userId }, // Messages reçus
        { expediteurId: userId }, // Messages envoyés
      ],
    },
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
      destinataire: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
      reservation: true,
      bateau: true,
    },
    orderBy: { dateEnvoi: "desc" },
    skip,
    take,
  });
}

// Marquer un message comme lu
async function markMessageAsRead(messageId, userId) {
  if (!messageId || !userId) throw new Error("messageId et userId sont requis");

  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message) throw new Error("Message introuvable");
  if (message.destinataireId !== userId)
    throw new Error("Accès interdit : vous n'êtes pas le destinataire");

  return prisma.message.update({
    where: { id: messageId },
    data: { lu: true },
  });
}

// Créer un message
async function createMessage({
  expediteurId,
  destinataireId,
  contenu,
  object,
  reservationId,
  bateauId,
}) {
  if (!expediteurId || !contenu)
    throw new Error("expediteurId et contenu sont requis");

  return prisma.message.create({
    data: {
      expediteurId,
      destinataireId,
      reservationId: reservationId || null,
      bateauId: bateauId || null,
      contenu,
      object: object || null,
      dateEnvoi: new Date(),
    },
  });
}

// Exporter toutes les fonctions
module.exports = {
  getMessagesForUser,
  markMessageAsRead,
  createMessage,
};
