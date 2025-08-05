const unsafePattern = /[<>{}$;]/;
const emailRegex = /^(?!.*\.\.)(?!.*[<>])(?!.*\.$)(?!^\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

function hasNoDangerousChars(input) {
  return typeof input === 'string' && !unsafePattern.test(input);
}

function validateRegisterInput({ nom, prenom, email, password }) {
  if (!nom || !prenom || !email || !password) {
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
  if (!passwordRegex.test(password)) {
    return 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial';
  }
  return null;
}

function isSafeInput(input) {
  const forbiddenChars = /[<>"'`;(){}]/;
  return !forbiddenChars.test(input);
}

module.exports = { validateRegisterInput, isSafeInput };
