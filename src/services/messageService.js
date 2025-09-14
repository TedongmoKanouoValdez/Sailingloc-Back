// auth.js
const prisma = require("../utils/prismaClient");

// Récupérer les messages d'un utilisateur
async function getMessagesForUser(userId, type = "recus", skip = 0, take = 20) {
  const userId = 111; // ⚠️ Assurez-vous que c'est un NUMBER

  console.log("=== DEBUG COMPLET ===");
  console.log("UserId:", userId, "Type:", typeof userId);

  // 1. Test SANS includes et SANS pagination
  const messagesSimple = await prisma.message.findMany({
    where: {
      OR: [{ destinataireId: userId }, { expediteurId: userId }],
    },
  });
  console.log("1. Sans includes - Count:", messagesSimple.length);

  // 2. Test AVEC includes mais SANS pagination
  const messagesWithIncludes = await prisma.message.findMany({
    where: {
      OR: [{ destinataireId: userId }, { expediteurId: userId }],
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
  });
  console.log("2. Avec includes - Count:", messagesWithIncludes.length);

  // 3. Test avec la requête EXACTE de votre fonction
  const messagesExact = await prisma.message.findMany({
    where: {
      OR: [{ destinataireId: userId }, { expediteurId: userId }],
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
    skip: 0,
    take: 20,
  });
  console.log("3. Exact function - Count:", messagesExact.length);

  // 4. Log tous les messages trouvés
  console.log("=== MESSAGES TROUVÉS ===");
  messagesExact.forEach((msg, index) => {
    console.log(
      `${index + 1}. ID: ${msg.id}, Exp: ${msg.expediteurId}, Dest: ${
        msg.destinataireId
      }`
    );
  });

  return messagesExact;
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
