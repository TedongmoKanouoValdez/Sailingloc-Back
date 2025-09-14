const { validateRegisterInput, isSafeInput } = require('../../../validation/authValidation');

describe('Validation des entrées', () => {

  // Test pour la validation des inputs d'inscription
  describe('validateRegisterInput', () => {
    test('Devrait retourner une erreur si un champ est manquant', () => {
      const result = validateRegisterInput({
        nom: 'Doe',
        prenom: 'John',
        email: '',
        password: 'Valid123!'
      });
      expect(result).toBe('Nom, prénom, email et mot de passe sont requis');
    });

    test('Devrait retourner une erreur si le nom est invalide', () => {
      const result = validateRegisterInput({
        nom: 'John123',
        prenom: 'Doe',
        email: 'john.doe@example.com',
        password: 'Valid123!'
      });
      expect(result).toBe('Nom invalide. Lettres uniquement sans caractères spéciaux dangereux.');
    });

    test('Devrait retourner une erreur si l\'email est invalide', () => {
      const result = validateRegisterInput({
        nom: 'John',
        prenom: 'Doe',
        email: 'john.doe@invalid',
        password: 'Valid123!'
      });
      expect(result).toBe('Email invalide ou dangereux');
    });

    test('Devrait retourner une erreur si le mot de passe est invalide', () => {
      const result = validateRegisterInput({
        nom: 'John',
        prenom: 'Doe',
        email: 'john.doe@example.com',
        password: 'short'
      });
      expect(result).toBe('Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial');
    });

    test('Devrait passer avec des entrées valides', () => {
      const result = validateRegisterInput({
        nom: 'John',
        prenom: 'Doe',
        email: 'john.doe@example.com',
        password: 'Valid123!'
      });
      expect(result).toBeNull();
    });
  });

  // Test pour la fonction isSafeInput
  describe('isSafeInput', () => {
    test('Devrait retourner true pour des entrées sûres', () => {
      const result = isSafeInput('john.doe@example.com');
      expect(result).toBe(true);
    });

    test('Devrait retourner false pour des entrées dangereuses', () => {
      const result = isSafeInput('john.doe@example.com<script>');
      expect(result).toBe(false);
    });
  });
});
