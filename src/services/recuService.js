const { PrismaClient } = require("@prisma/client");
const { cloudinary } = require("../utils/cloudinaryConfig");
const streamifier = require("streamifier");
const prisma = new PrismaClient();

async function uploadRecuService(fileBuffer, fileName, reservationId) {
  // Récupère le paiement lié à la réservation
  const paiement = await prisma.paiement.findUnique({
    where: { reservationId: parseInt(reservationId) },
    include: { recu: true },
  });

  if (!paiement) throw new Error("Paiement non trouvé");
  if (paiement.recu) throw new Error("Un reçu existe déjà pour ce paiement");

  // Upload sur Cloudinary via buffer
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "recus",
        use_filename: true,
        unique_filename: false,
        resource_type: "auto",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

  // Crée le reçu en base
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

  return { url: result.secure_url, recuId: recu.id };
}

module.exports = { uploadRecuService };
