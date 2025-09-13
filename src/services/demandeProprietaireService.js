const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAdmin = () =>
  prisma.utilisateur.findFirst({ where: { role: "ADMIN" } });

const dayjs = require("dayjs");

exports.createDemande = async (userId, payload) => {
  const now = dayjs();
  const today = now.startOf("day").toDate(); // 00:00:00
  const sevenDaysAgo = now.subtract(7, "day").startOf("day").toDate();

  //Vérifie s’il y a déjà une demande aujourd’hui
  const todayDemand = await prisma.demandeProprietaire.findUnique({
    where: {
      utilisateurId_dateDemande: {
        utilisateurId: Number(userId),
        dateDemande: today,
      },
    },
  });
  if (todayDemand) {
    const err = new Error("Vous avez déjà envoyé une demande aujourd’hui.");
    err.code = "DAILY_LIMIT";
    throw err;
  }

  const lastDemand = await prisma.demandeProprietaire.findFirst({
    where: {
      utilisateurId: Number(userId),
      dateDemande: { gte: sevenDaysAgo },
    },
    orderBy: { dateDemande: "desc" },
  });
  if (lastDemand) {
    const nextAllowed = dayjs(lastDemand.dateDemande)
      .add(7, "day")
      .format("DD/MM/YYYY");
    const err = new Error(
      `Vous pourrez refaire une demande à partir du ${nextAllowed}.`
    );
    err.code = "WEEKLY_LIMIT";
    throw err;
  }

  return prisma.demandeProprietaire.create({
    data: {
      utilisateur: { connect: { id: Number(userId) } },
      data: JSON.stringify(payload),
      dateDemande: today,
      statut: "EN_ATTENTE",
    },
  });
};

exports.notifyAdmin = async (userId, demandeId, nomComplet) => {
  const admin = await getAdmin();
  if (!admin) throw new Error("Aucun administrateur trouvé");

  return prisma.message.create({
    data: {
      expediteurId: Number(userId),
      destinataireId: admin.id,
      contenu:
        "Un de nos experts a été notifié et vous contactera rapidement pour finaliser votre demande.",
      object: "Demande enregistrée avec succès !",
      dateEnvoi: new Date(),
    },
  });
};

// 🔄 Met à jour le statut d'une demande
exports.updateStatut = async (demandeId, newStatut) => {
  const demande = await prisma.demandeProprietaire.findUnique({
    where: { id: Number(demandeId) },
    include: { utilisateur: true },
  });
  if (!demande) throw new Error("Demande non trouvée");

  // Si accepté → change le rôle de l'utilisateur
  if (newStatut === "ACCEPTEE") {
    await prisma.utilisateur.update({
      where: { id: demande.utilisateur.id },
      data: { role: "PROPRIETAIRE" },
    });

    await prisma.message.create({
      data: {
        expediteurId: 0, // système / admin
        destinataireId: demande.utilisateur.id,
        contenu:
          "Votre demande a été acceptée, vous êtes maintenant PROPRIETAIRE.",
        object: "Demande acceptée",
        dateEnvoi: new Date(),
      },
    });
  }

  // Si refusé → envoie message
  if (newStatut === "REFUSEE") {
    await prisma.message.create({
      data: {
        expediteurId: 0,
        destinataireId: demande.utilisateur.id,
        contenu: "Votre demande a été refusée.",
        object: "Demande refusée",
        dateEnvoi: new Date(),
      },
    });
  }

  // Met à jour le statut de la demande
  return prisma.demandeProprietaire.update({
    where: { id: Number(demandeId) },
    data: { statut: newStatut, dateTraitement: new Date() },
  });
};
