const express = require("express");
const router = express.Router();
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

// Fonction pour générer un slug à partir du nom
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Fonction pour générer un slug unique
async function generateUniqueSlug(nomBateau) {
  const baseSlug = generateSlug(nomBateau);
  let slug = baseSlug;
  let index = 1;

  while (await prisma.bateau.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${index++}`;
  }

  return slug;
}

// POST /bateaux - créer un bateau
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const slug = await generateUniqueSlug(data.nomBateau);

    const bateau = await prisma.bateau.create({
      data: {
        nom: data.nomBateau,
        slug,
        modele: data.modeleMarque,
        portdefault: data.portattache || "Port inconnu",
        typeBateau: data.typeBateau || "inconnu",
        description: data.description,
        datesIndisponibles: JSON.stringify(data.indisponibilites || []),
        proprietaireId: data.proprietaireId, // À remplacer si besoin

        details: {
          create: {
            longueur: parseFloat(data.longueur) || null,
            largeur: parseFloat(data.largeur) || null,
            tirantEau: parseFloat(data.tirantEau) || null,
            capaciteMax: parseInt(data.capaciteMax) || null,
            nombreCabines: parseInt(data.nombreCabines) || null,
            nombreCouchages: parseInt(data.nombreCouchages) || null,
            equipements: JSON.stringify(data.equipementsInclus || []),
            optionsPayantes: JSON.stringify(data.tags || []),
            zonesNavigation: data.zonesnavigation || "",
            depotgarantie: data.Depotgarantie || "",
            dureeLocation: data.DureeLocation || "",
            politiqueAnnulation: data.politiqueAnnulation || "",
            locationSansPermis: !!data.locationSansPermis,
            numeroPoliceAssurance: data.numeroPoliceAssurance || "",
            certificatNavigation: data.certificatNavigation || "",
            portdedepart: data.portdepart || "",
            portdarriver: data.portarriver || "",
            anneeConstruction: data.anneeConstruction || "",
            tarifications: JSON.stringify(data.tarifications || []),
            PassagersInclusDansLePrix: data.PassagersInclusDansLePrix || "",
            SupplementParPassagerSupplémentaire:
              data.SupplementParPassagerSupplémentaire || "",
            moteur: data.Moteurs || "",
            reservoirEau: data.reservoirEau || "",
            reservoirCarburant: data.reservoirCarburant || "",
          },
        },
      },
    });

    res.status(201).json({ success: true, bateau, bateauId: bateau.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création du bateau" });
  }
});

// GET /bateaux - récupérer tous les bateaux
router.get("/", async (req, res) => {
  try {
    const bateaux = await prisma.bateau.findMany({
      include: { details: true, medias: true, proprietaire: true },
    });
    res.json({ success: true, bateaux });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des bateaux" });
  }
});

// GET /bateaux/:id - récupérer un bateau par ID
router.get("/:id", async (req, res) => {
  try {
    const bateau = await prisma.bateau.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        details: true,
        medias: true,
        proprietaire: true,
      },
    });

    if (!bateau) {
      return res.status(404).json({ error: "Bateau non trouvé" });
    }

    res.json({ success: true, bateau });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération du bateau" });
  }
});

// GET /bateaux/slug/:slug - récupérer un bateau par slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const bateau = await prisma.bateau.findUnique({
      where: { slug: req.params.slug },
      include: {
        details: true,
        medias: true,
        proprietaire: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            // ajoute ici les champs que tu veux exposer
          },
        },
      },
    });

    if (!bateau) {
      return res.status(404).json({ error: "Bateau non trouvé" });
    }

    res.json({ success: true, bateau });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /bateaux/:id - mise à jour d’un bateau
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const bateauExistant = await prisma.bateau.findUnique({
      where: { id: parseInt(id) },
      include: { details: true },
    });

    if (!bateauExistant) {
      return res.status(404).json({ error: "Bateau non trouvé" });
    }

    const updateData = {
      nom: data.nomBateau,
      modele: data.modeleMarque,
      port: data.portattache,
      portdefault: data.portdefault,
      typeBateau: data.typeBateau,
      description: data.description,
      datesIndisponibles: JSON.stringify(data.indisponibilites || []),
      details: {
        [bateauExistant.details ? "update" : "create"]: {
          anneeConstruction: data.anneeConstruction || "",
          longueur: parseFloat(data.longueur) || null,
          largeur: parseFloat(data.largeur) || null,
          tirantEau: parseFloat(data.tirantEau) || null,
          nombreCabines: parseInt(data.nombreCabines) || null,
          nombreCouchages: parseInt(data.nombreCouchages) || null,
          capaciteMax: parseInt(data.capaciteMax) || null,
          portdedepart: data.portdedepart || "",
          portdarriver: data.portdarriver || "",
          depotgarantie: data.depotgarantie || "",
          politiqueAnnulation: data.politiqueAnnulation || "",
          dureeLocation: data.dureeLocation || "",
          locationSansPermis: !!data.locationSansPermis,
          equipements: JSON.stringify(data.equipementsInclus || []),
          optionsPayantes: JSON.stringify(data.tags || []),
          tarifications: JSON.stringify(data.tarifications || []),
          zonesNavigation: data.zonesNavigation || "",
          numeroPoliceAssurance: data.numeroPoliceAssurance || "",
          certificatNavigation: data.certificatNavigation || "",
          PassagersInclusDansLePrix: data.PassagersInclusDansLePrix || "",
          SupplementParPassagerSupplémentaire:
            data.SupplementParPassagerSupplémentaire || "",
          moteur: data.Moteurs || "",
          reservoirEau: data.reservoirEau || "",
          reservoirCarburant: data.reservoirCarburant || "",
        },
      },
    };

    const bateau = await prisma.bateau.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { details: true },
    });

    res.json({ success: true, bateau });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({
      error: "Erreur lors de la mise à jour du bateau",
      message: error?.message,
      stack: error?.stack,
    });
  }
});

// DELETE /bateaux/:id - suppression d’un bateau
router.delete("/slug/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    // Récupérer le bateau par son slug pour avoir son id
    const bateau = await prisma.bateau.findUnique({
      where: { slug: slug },
    });

    if (!bateau) {
      return res.status(404).json({ error: "Bateau non trouvé" });
    }

    // Supprimer les détails liés au bateau (avec son id)
    await prisma.detailsBateau.deleteMany({ where: { bateauId: bateau.id } });

    // Supprimer le bateau lui-même
    await prisma.bateau.delete({ where: { id: bateau.id } });

    res.json({ success: true, message: "Bateau supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la suppression du bateau" });
  }
});

// GET /bateaux/proprietaire/:proprietaireId
router.get("/proprietaire/:proprietaireId", async (req, res) => {
  const { proprietaireId } = req.params;

  try {
    const bateaux = await prisma.bateau.findMany({
      where: { proprietaireId: parseInt(proprietaireId) },
      include: {
        details: true,
        medias: true,
        proprietaire: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            // ajoute ici les champs que tu veux exposer
          },
        },
      },
    });

    if (!bateaux || bateaux.length === 0) {
      return res.json({ bateaux: [] });
    }

    res.json({ success: true, bateaux });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
