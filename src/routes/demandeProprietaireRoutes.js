const express = require('express');
const router = express.Router();
const controller = require('../controllers/demandeProprietaireController');

router.post('/demandes', controller.postDemande);

router.get('/admin/demandes', async (req, res) => {
  const demandes = await prisma.demandeProprietaire.findMany({
    include: { utilisateur: true }
  });
  res.json(demandes);
});

// Mettre à jour le statut
router.put("/admin/demandes/:id", controller.updateStatut);

module.exports = router;