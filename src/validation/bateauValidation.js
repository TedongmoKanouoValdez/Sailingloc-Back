const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bateauValidationRules = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('modele').trim().notEmpty().withMessage('Le modèle est obligatoire'),

  // Validation unique nom + modele
  body(['nom', 'modele']).custom(async (value, { req }) => {
    const { nom, modele } = req.body;
    if (!nom || !modele) {
      // Si nom ou modele manquant, on laisse passer, la validation notEmpty gère ça
      return true;
    }

    const existingBateau = await prisma.bateau.findFirst({
      where: {
        nom,
        modele,
      },
    });

    if (existingBateau) {
      return Promise.reject('Un bateau avec ce nom et ce modèle existe déjà');
    }
    return true;
  }),

  body('port').trim().notEmpty().withMessage('Le port est obligatoire'),
  body('prix').isFloat({ gt: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('description').optional().isString(),

  body('datesIndisponibles').optional()
    .matches(/^(\d{4}-\d{2}-\d{2})(,\d{4}-\d{2}-\d{2})*$/)
    .withMessage('Format des dates indisponibles incorrect'),

  // Validation détails
  body('details.longueur').isFloat({ gt: 0 }).withMessage('Longueur doit être un nombre positif'),
  body('details.largeur').isFloat({ gt: 0 }).withMessage('Largeur doit être un nombre positif'),
  body('details.tirantEau').isFloat({ gt: 0 }).withMessage('Tirant d\'eau doit être un nombre positif'),
  body('details.capaciteMax').isInt({ gt: 0 }).withMessage('Capacité max doit être un entier positif'),
  body('details.nombreCabines').isInt({ gt: 0 }).withMessage('Nombre de cabines doit être un entier positif'),
  body('details.nombreCouchages').isInt({ gt: 0 }).withMessage('Nombre de couchages doit être un entier positif'),
  body('details.equipements').optional().isString(),
  body('details.optionsPayantes').optional().isString(),
  body('details.zonesNavigation').optional().isString(),
  body('details.politiqueAnnulation').optional().isString(),
  body('details.locationSansPermis').isBoolean().withMessage('Location sans permis doit être un booléen'),
  body('details.numeroPoliceAssurance').optional().isString(),
  body('details.certificatNavigation').optional().isString(),
];

module.exports = { bateauValidationRules };
