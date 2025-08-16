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
        prix: data.tarifbateau || new Prisma.Decimal("0"),
        description: data.description,
        datesIndisponibles: JSON.stringify(data.indisponibilites || []),
        proprietaireId: 1, // À remplacer si besoin

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
      include: { details: true },
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
        proprietaire: {
          include: {
            utilisateur: true,
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
          include: {
            utilisateur: true,
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
      include: { details: true, medias: true },
    });

    if (!bateauExistant) {
      return res.status(404).json({ error: "Bateau non trouvé" });
    }

    // Construire updateData sans redéclaration
    const updateData = {
      nom: data.nomBateau,
      modele: data.modeleMarque,
      port: data.portattache,
      prix: new Prisma.Decimal(data.tarifbateau || "0"),
      description: data.description,
      datesIndisponibles: JSON.stringify(data.indisponibilites || []),
      disponibilite: data.disponibilite ?? true,
    };

    const detailsPayload = {
      longueur: parseFloat(data.longueur) || null,
      largeur: parseFloat(data.largeur) || null,
      tirantEau: parseFloat(data.tirantEau) || null,
      capaciteMax: parseInt(data.capaciteMax) || null,
      nombreCabines: parseInt(data.nombreCabines) || null,
      nombreCouchages: parseInt(data.nombreCouchages) || null,
      equipements: JSON.stringify(data.equipementsInclus || []),
      optionsPayantes: JSON.stringify(data.tags || []),
      zonesNavigation: data.zonesNavigation || "",
      politiqueAnnulation: data.politiqueAnnulation || "",
      locationSansPermis: !!data.locationSansPermis,
      numeroPoliceAssurance: data.numeroPoliceAssurance || "",
      certificatNavigation: data.certificatNavigation || "",
      portdedepart: data.portdepart || "",
      portdarriver: data.portarriver || "",
      anneeConstruction: data.anneeConstruction || "",
      tarifications: JSON.stringify(data.tarifications || []),
    };

    updateData.details = bateauExistant.details
      ? { update: detailsPayload }
      : { create: detailsPayload };

    // Mettre à jour les médias si fournis
    if (data.medias && Array.isArray(data.medias)) {
      await prisma.media.deleteMany({
        where: { bateauId: parseInt(id) },
      });
      await prisma.media.createMany({
        data: data.medias.map((media) => ({
          url: media.url,
          type: media.type,
          bateauId: parseInt(id),
        })),
      });
    }

    const bateau = await prisma.bateau.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { details: true, medias: true },
    });

    res.json({ success: true, bateau });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du bateau" });
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

module.exports = router;
