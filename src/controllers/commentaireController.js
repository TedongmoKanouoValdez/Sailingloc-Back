// auth.js
const prisma = require("../utils/prismaClient");

exports.getCommentaires = async (req, res) => {
  const { bateauId } = req.query;
  try {
    const commentaires = await prisma.commentaire.findMany({
      where: bateauId ? { bateauId: Number(bateauId) } : {},
      include: {
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            photoProfil: true,
            email: true,
            telephone: true,
          },
        },
      },
      orderBy: { creeLe: "desc" },
    });
    res.json(commentaires);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.createCommentaire = async (req, res) => {
  const { contenu, note, auteurId, bateauId, reservationId } = req.body;

  if (!contenu || !note || !auteurId) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  try {
    const nouveauCommentaire = await prisma.commentaire.create({
      data: {
        contenu,
        note,
        auteurId,
        bateauId: bateauId ? Number(bateauId) : undefined,
        reservationId: reservationId ? Number(reservationId) : undefined,
      },
    });
    res.status(201).json(nouveauCommentaire);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création commentaire" });
  }
};
