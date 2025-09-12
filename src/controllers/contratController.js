const { PrismaClient } = require("@prisma/client");
const { cloudinary } = require("../utils/cloudinaryConfig");
const fs = require("fs");
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

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "contrats",
      use_filename: true,
      unique_filename: false,
      resource_type: "auto",
    });

    await prisma.media.create({
      data: {
        url: result.secure_url,
        type: "CONTRAT",
        titre: "Contrat de location",
        contratId: contrat.id,
      },
    });

    fs.unlinkSync(req.file.path);

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = { uploadContrat };
