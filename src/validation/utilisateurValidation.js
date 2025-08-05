// validation/utilisateurValidation.js

// Regex et fonctions de validation
const unsafePattern = /[<>{}$;]/;
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|fr|net|org|edu|gov|io|info|co|biz)$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
const phoneRegex = /^\+?[0-9\s\-]{7,15}$/; // chiffres, espaces, tirets, optionnel + au début

function hasNoDangerousChars(input) {
  return typeof input === 'string' && !unsafePattern.test(input);
}

// Fonction dédiée de validation pour l'inscription
function validateUtilisateurInput({ nom, prenom, email, motDePasse, telephone }) {
  if (!nom || !prenom || !email || !motDePasse) {
    return 'Nom, prénom, email et mot de passe sont requis';
  }
  if (!hasNoDangerousChars(nom) || !nameRegex.test(nom)) {
    return 'Nom invalide. Lettres uniquement sans caractères spéciaux dangereux.';
  }
  if (!hasNoDangerousChars(prenom) || !nameRegex.test(prenom)) {
    return 'Prénom invalide. Lettres uniquement sans caractères spéciaux dangereux.';
  }
  if (!hasNoDangerousChars(email) || !emailRegex.test(email)) {
    return 'Email invalide ou dangereux';
  }
  if (!passwordRegex.test(motDePasse)) {
    return 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial';
  }
  // Validation téléphone (optionnelle)
  if (telephone && (!hasNoDangerousChars(telephone) || !phoneRegex.test(telephone))) {
    return 'Téléphone invalide. Format attendu : chiffres, espaces, tirets, optionnel + au début.';
  }

  return null; // pas d’erreur
}

module.exports = {
  validateUtilisateurInput,
};
