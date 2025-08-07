const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const upload = require("../middleware/upload");
const cloudinary = require("../utils/cloudinaryConfig");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, OPTIONS, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

router.post(
  "/",
  upload.fields([
    { name: "section1", maxCount: 4 },
    { name: "section2", maxCount: 5 },
    { name: "attestation1", maxCount: 1 },
    { name: "certificat", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const uploadedUrls = [];

      const {
        nomBateau = null,
        description = null,
        capaciteMax = null,
        bateauId = null,
        utilisateurId = null,
        numeroPolice = null,
        noCertificat = null,
      } = req.body;

      console.log("Body reçu :", req.body);
      console.log("Fichiers reçus :", Object.keys(req.files || {}));

      const getRelation = (key, id) =>
        id && !isNaN(parseInt(id))
          ? { [key]: { connect: { id: parseInt(id) } } }
          : {};

      const fileGroups = {
        section1: req.files?.section1 || [],
        section2: req.files?.section2 || [],
        attestation1: req.files?.attestation1 || [],
        certificat: req.files?.certificat || [],
      };

      const uploadAndSave = async (file, type) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "mon-projet-bateau",
        });

        const media = await prisma.media.create({
          data: {
            url: result.secure_url,
            type,
            titre: file.originalname,
            description: null,
            numeroPolice: numeroPolice || null, // facultatif
            ...getRelation("bateau", bateauId),
            ...getRelation("utilisateur", utilisateurId),
          },
        });

        await fs.remove(file.path);
        return media;
      };

      // SECTION 1
      for (let i = 0; i < fileGroups.section1.length; i++) {
        const file = fileGroups.section1[i];
        const type = i === 0 ? "COVER" : "GALLERIE";
        const media = await uploadAndSave(file, type);
        uploadedUrls.push(media);
      }

      // SECTION 2
      for (const file of fileGroups.section2) {
        const media = await uploadAndSave(file, "GALLERIE");
        uploadedUrls.push(media);
      }

      // ATTESTATION
      for (const file of fileGroups.attestation1) {
        const media = await uploadAndSave(file, "ATTESTATION_ASSURANCE");
        uploadedUrls.push(media);
      }

      // CERTIFICAT (si noCertificat n'est pas true)
      if (noCertificat !== "true") {
        for (const file of fileGroups.certificat) {
          const media = await uploadAndSave(file, "CERTIFICAT_NAVIGATION");
          uploadedUrls.push(media);
        }
      }

      return res.json({
        success: true,
        message: "Upload réussi",
        medias: uploadedUrls,
        infos: {
          nomBateau,
          description,
          capaciteMax,
          numeroPolice,
          utilisateurId,
          bateauId,
        },
      });
    } catch (error) {
      console.error("Erreur upload Cloudinary ou enregistrement DB :", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'upload ou de l'enregistrement",
        error: error.message,
      });
    }
  }
);

module.exports = router;
