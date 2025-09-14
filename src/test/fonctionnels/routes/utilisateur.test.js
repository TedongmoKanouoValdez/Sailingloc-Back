const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Mock de PrismaClient avant de l'instancier
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      utilisateur: {
        findUnique: jest.fn(),
        // Ajoutez d'autres méthodes si nécessaire pour les autres tests
      }
    }))
  };
});

const prisma = new PrismaClient();

// Mock des contrôleurs
const mockControllers = {
  createUtilisateur: jest.fn((req, res) => res.status(201).json({ message: 'Utilisateur créé' })),
  updateUtilisateur: jest.fn((req, res) => res.status(200).json({ message: 'Utilisateur modifié' })),
  deleteUtilisateur: jest.fn((req, res) => res.status(200).json({ message: 'Utilisateur supprimé' })),
  getAllUtilisateurs: jest.fn((req, res) => res.status(200).json([{ id: 1, nom: 'Doe' }])),
  getUtilisateur: jest.fn((req, res) => res.status(200).json({ id: 1, nom: 'Doe' }))
};

jest.mock('../../../controllers/utilisateurController', () => mockControllers);

// Mock des middlewares
const authMiddleware = jest.fn((req, res, next) => {
  req.user = { userId: 1 };
  next();
});

const upload = {
  single: jest.fn(() => (req, res, next) => {
    req.file = { filename: 'test.jpg' };
    next();
  }),
  array: jest.fn(() => (req, res, next) => {
    req.files = [{ filename: 'test.jpg' }];
    next();
  })
};

const app = express();
app.use(express.json());

// Importez et utilisez les routes réelles
const router = require('../../../routes/utilisateurRoute');

// Remplacez les middlewares par des mocks dans le router
router.stack.forEach(layer => {
  if (layer.route) {
    layer.route.stack.forEach(routeLayer => {
      // Remplacer authMiddleware par notre mock
      if (routeLayer.handle.name === 'authMiddleware') {
        routeLayer.handle = authMiddleware;
      }
      // Remplacer upload.single/array par nos mocks
      if (routeLayer.handle.name === 'uploadSingle' || 
          routeLayer.handle.name === 'uploadArray') {
        const path = layer.route.path;
        const method = Object.keys(layer.route.methods)[0];
        
        if (method === 'post' && path === '/') {
          routeLayer.handle = upload.array('photoProfil', 2);
        } else if (method === 'put' && path === '/:id') {
          routeLayer.handle = upload.single('photoProfil');
        }
      }
    });
  }
});

app.use('/api/utilisateurs', router);

describe('Routes Utilisateur', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Réinitialiser les mocks
    authMiddleware.mockImplementation((req, res, next) => {
      req.user = { userId: 1 };
      next();
    });

    // Mock par défaut pour Prisma (utilisateur trouvé)
    prisma.utilisateur.findUnique.mockResolvedValue({
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      role: 'USER',
      photoProfil: 'profile.jpg'
    });
  });

  describe('Route GET /api/utilisateurs/me', () => {

    it('devrait retourner 404 si l\'utilisateur n\'est pas trouvé', async () => {
      // Simuler un utilisateur non trouvé
      prisma.utilisateur.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/utilisateurs/me');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Utilisateur non trouvé' });
    });
  });

  describe('POST /api/utilisateurs', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      // Simuler l'upload de fichier
      upload.array.mockImplementationOnce(() => (req, res, next) => {
        req.files = [{ filename: 'test.jpg' }];
        req.file = req.files[0];
        next();
      });

      const response = await request(app)
        .post('/api/utilisateurs')
        .field('nom', 'Doe')
        .field('prenom', 'John')
        .field('email', 'john.doe@example.com')
        .field('role', 'USER')
        .field('motDePasse', 'password123')
        .attach('photoProfil', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Utilisateur créé' });
    });

    it('devrait retourner 400 si aucun fichier n\'est uploadé', async () => {
      upload.array.mockImplementationOnce(() => (req, res, next) => {
        req.files = [];
        next();
      });

      const response = await request(app)
        .post('/api/utilisateurs')
        .send({
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Photo de profil requise' });
    });
  });

  describe('GET /api/utilisateurs', () => {
    it('devrait retourner la liste de tous les utilisateurs', async () => {
      const response = await request(app).get('/api/utilisateurs');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, nom: 'Doe' }]);
      expect(mockControllers.getAllUtilisateurs).toHaveBeenCalled();
    });
  });

  describe('GET /api/utilisateurs/:id', () => {
    it('devrait retourner un utilisateur spécifique', async () => {
      const response = await request(app).get('/api/utilisateurs/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, nom: 'Doe' });
      expect(mockControllers.getUtilisateur).toHaveBeenCalled();
    });
  });

  describe('PUT /api/utilisateurs/:id', () => {
    it('devrait mettre à jour un utilisateur', async () => {
      upload.single.mockImplementationOnce(() => (req, res, next) => {
        req.file = { filename: 'updated.jpg' };
        next();
      });

      const response = await request(app)
        .put('/api/utilisateurs/1')
        .field('nom', 'Updated')
        .attach('photoProfil', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Utilisateur modifié' });
      expect(mockControllers.updateUtilisateur).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/utilisateurs/:id', () => {
    it('devrait supprimer un utilisateur', async () => {
      const response = await request(app).delete('/api/utilisateurs/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Utilisateur supprimé' });
      expect(mockControllers.deleteUtilisateur).toHaveBeenCalled();
    });
  });
});