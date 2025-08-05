const { createUserWithPhoto } = require('../services/utilisateurService');

async function createUtilisateur(req, res) {
  try {
    const data = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Photo de profil requise' });
    }

    const utilisateur = await createUserWithPhoto(data, file);

    // ✅ On renvoie bien les objets créés
    res.status(201).json({
      message: 'Utilisateur créé',
      utilisateur
    });
  } catch (error) {
    if (error.code === 'P2002') {
    if (error.meta && error.meta.target.includes('email')) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
    if (error.meta && error.meta.target.includes('telephone')) {
      return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
    }

  return res.status(409).json({ message: 'Conflit de données uniques' });
}


    console.error(error);
    res.status(500).json({ message: error.message || 'Erreur lors de la création de l\'utilisateur'});
  }
}

module.exports = { createUtilisateur };
