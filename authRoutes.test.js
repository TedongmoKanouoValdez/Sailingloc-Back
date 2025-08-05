const request = require('supertest');
const app = require('./src/app'); // Remplace par le chemin de ton fichier app.js ou le fichier où tu initialises ton express app

describe('Test des routes d\'authentification', () => {

  // Test de l'inscription
  describe('POST /api/auth/register', () => {
    test('Devrait créer un nouvel utilisateur avec des données valides', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nom: 'John',
          prenom: 'Doe',
          email: 'john.doe@example.com',
          password: 'Valid123!',
          role: 'CLIENT'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Utilisateur créé');
      expect(response.body.user).toHaveProperty('email', 'john.doe@example.com');
      expect(response.body.user).not.toHaveProperty('motDePasse');
    });

    test('Devrait retourner une erreur si l\'email est déjà utilisé', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          nom: 'John',
          prenom: 'Doe',
          email: 'john.doe@example.com',
          password: 'Valid123!',
          role: 'CLIENT'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nom: 'Jane',
          prenom: 'Doe',
          email: 'john.doe@example.com',
          password: 'Valid123!',
          role: 'CLIENT'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email déjà utilisé');
    });

    test('Devrait retourner une erreur pour des données invalides', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nom: '',
          prenom: 'Doe',
          email: 'invalidemail',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nom, prénom, email et mot de passe sont requis');
    });
  });

  // Test de la connexion
  describe('POST /api/auth/login', () => {
    test('Devrait connecter un utilisateur avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'Valid123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    test('Devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Valid123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });

    test('Devrait retourner une erreur si le mot de passe est incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'WrongPassword!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Mot de passe incorrect');
    });
  });
});
