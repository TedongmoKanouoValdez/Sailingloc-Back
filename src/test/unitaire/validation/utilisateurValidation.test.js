const { validateUtilisateurInput } = require('../../../validation/utilisateurValidation');

describe('validateUtilisateurInput', () => {
  // Données de test valides de base
  const validUserData = {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    motDePasse: 'Password123!'
  };

  describe('Validation réussie', () => {
    it('devrait retourner null pour des données valides', () => {
      const result = validateUtilisateurInput(validUserData);
      expect(result).toBeNull();
    });

    it('devrait accepter différents domaines email valides', () => {
      const domains = ['com', 'fr', 'net', 'org', 'edu', 'gov', 'io', 'info', 'co', 'biz'];
      
      domains.forEach(domain => {
        const result = validateUtilisateurInput({
          ...validUserData,
          email: `test@example.${domain}`
        });
        expect(result).toBeNull();
      });
    });
  });

  describe('Validation des champs requis', () => {
    it('devrait refuser sans nom', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        nom: ''
      });
      expect(result).toBe('Nom, prénom, email et mot de passe sont requis');
    });

    it('devrait refuser sans prénom', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        prenom: ''
      });
      expect(result).toBe('Nom, prénom, email et mot de passe sont requis');
    });

    it('devrait refuser sans email', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        email: ''
      });
      expect(result).toBe('Nom, prénom, email et mot de passe sont requis');
    });

    it('devrait refuser sans mot de passe', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        motDePasse: ''
      });
      expect(result).toBe('Nom, prénom, email et mot de passe sont requis');
    });
  });

  describe('Validation du nom et prénom', () => {
    it('devrait refuser un nom avec caractères dangereux', () => {
      const invalidNames = [
        'Dupont<script>',
        'Dupont{',
        'Dupont}',
        'Dupont$',
        'Dupont;'
      ];

      invalidNames.forEach(nom => {
        const result = validateUtilisateurInput({
          ...validUserData,
          nom
        });
        expect(result).toBe('Nom invalide. Lettres uniquement sans caractères spéciaux dangereux.');
      });
    });

    it('devrait refuser un prénom avec caractères dangereux', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        prenom: 'Jean<script>'
      });
      expect(result).toBe('Prénom invalide. Lettres uniquement sans caractères spéciaux dangereux.');
    });

    it('devrait accepter les noms avec accents et tirets', () => {
      const validNames = [
        'Dupont-Élève',
        'Déjà',
        'François',
        'Marie-Claire',
        "O'Connor"
      ];

      validNames.forEach(nom => {
        const result = validateUtilisateurInput({
          ...validUserData,
          nom
        });
        expect(result).toBeNull();
      });
    });
  });

  describe('Validation de l\'email', () => {
    it('devrait refuser un email avec caractères dangereux', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        email: 'jean<script>@example.com'
      });
      expect(result).toBe('Email invalide ou dangereux');
    });

    it('devrait refuser un email avec domaine invalide', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        email: 'jean@example.invalid'
      });
      expect(result).toBe('Email invalide ou dangereux');
    });

    it('devrait refuser un email mal formaté', () => {
      const invalidEmails = [
        'jean.example.com',
        'jean@example',
        '@example.com',
        'jean@.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateUtilisateurInput({
          ...validUserData,
          email
        });
        expect(result).toBe('Email invalide ou dangereux');
      });
    });
  });

  describe('Validation du mot de passe', () => {

    it('devrait refuser un mot de passe sans majuscule', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        motDePasse: 'password123!'
      });
      expect(result).toBe('Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial');
    });

    it('devrait refuser un mot de passe sans chiffre', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        motDePasse: 'Password!'
      });
      expect(result).toBe('Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial');
    });

    it('devrait refuser un mot de passe sans caractère spécial', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        motDePasse: 'Password123'
      });
      expect(result).toBe('Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial');
    });

    it('devrait accepter différents caractères spéciaux', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', "'", '"', '\\', '|', ',', '.', '<', '>', '/', '?'];

      specialChars.forEach(char => {
        const result = validateUtilisateurInput({
          ...validUserData,
          motDePasse: `Password123${char}`
        });
        expect(result).toBeNull();
      });
    });
  });

  describe('Validation du téléphone', () => {
    it('devrait refuser un téléphone avec caractères dangereux', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        telephone: '06<script>123456'
      });
      expect(result).toBe('Téléphone invalide. Format attendu : chiffres, espaces, tirets, optionnel + au début.');
    });

    it('devrait refuser un téléphone trop court', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        telephone: '06123'
      });
      expect(result).toBe('Téléphone invalide. Format attendu : chiffres, espaces, tirets, optionnel + au début.');
    });

    it('devrait refuser un téléphone trop long', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        telephone: '+336123456789012345'
      });
      expect(result).toBe('Téléphone invalide. Format attendu : chiffres, espaces, tirets, optionnel + au début.');
    });

    it('devrait refuser un téléphone avec lettres', () => {
      const result = validateUtilisateurInput({
        ...validUserData,
        telephone: '06ABCD5678'
      });
      expect(result).toBe('Téléphone invalide. Format attendu : chiffres, espaces, tirets, optionnel + au début.');
    });
  });
});