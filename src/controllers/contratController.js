const { PrismaClient } = require("@prisma/client");
const { cloudinary } = require("../utils/cloudinaryConfig");
const streamifier = require("streamifier");
const prisma = new PrismaClient();

async function uploadContrat(req, res) {
  try {
    const { reservationId } = req.body;
    if (!reservationId)
      return res.status(400).json({ error: "Reservation ID manquant" });

    let contrat = await prisma.contrat.findUnique({
      where: { reservationId: parseInt(reservationId) },
    });
    if (!contrat) {
      contrat = await prisma.contrat.create({
        data: { reservationId: parseInt(reservationId), signature: true },
      });
    }

    // Upload buffer vers Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "contrats",
          use_filename: true,
          unique_filename: false,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    await prisma.media.create({
      data: {
        url: result.secure_url,
        type: "CONTRAT",
        titre: "Contrat de location",
        contratId: contrat.id,
      },
    });

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = { uploadContrat };
