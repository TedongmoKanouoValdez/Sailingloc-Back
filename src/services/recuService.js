const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../utils/cloudinaryConfig");
const fs = require("fs");
const prisma = new PrismaClient();

async function uploadRecuService(filePath, reservationId) {
  // Récupère le paiement lié à la réservation
  const paiement = await prisma.paiement.findUnique({
    where: { reservationId: parseInt(reservationId) },
    include: { recu: true },
  });

  if (!paiement) throw new Error("Paiement non trouvé");
  if (paiement.recu) throw new Error("Un reçu existe déjà pour ce paiement");

  // Upload sur Cloudinary
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "recus",
    use_filename: true,
    unique_filename: false,
    resource_type: "auto",
  });

  // Crée le reçu
  const recu = await prisma.recu.create({
    data: {
      paiementId: paiement.id,
      media: {
        create: {
          url: result.secure_url,
          type: "RECUS",
          titre: "Reçu de paiement",
        },
      },
    },
  });

  fs.unlinkSync(filePath);
  return { url: result.secure_url, recuId: recu.id };
}

module.exports = { uploadRecuService };
