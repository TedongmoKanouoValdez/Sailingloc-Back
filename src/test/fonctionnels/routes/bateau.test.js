const request = require('supertest');
const express = require('express');

// Mock de PrismaClient AVANT l'import des routes
jest.mock('@prisma/client', () => {
  const mockBateau = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDetailsBateau = {
    deleteMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      bateau: mockBateau,
      detailsBateau: mockDetailsBateau,
    })),
    Prisma: {
      JsonNull: null
    }
  };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
app.use(express.json());

// Import des routes APRÈS le mock de Prisma
const router = require('../../../routes/bateauRoute');
app.use('/api/bateaux', router);

describe('Routes Bateaux', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/bateaux', () => {
    it('devrait créer un nouveau bateau avec succès', async () => {
      const bateauData = {
        nomBateau: 'Mon Bateau Test',
        modeleMarque: 'Modèle Test',
        portattache: 'Port de Test',
        typeBateau: 'Voilier',
        description: 'Description test',
        proprietaireId: 1,
        longueur: '12.5',
      };

      // Mock de la création réussie
      prisma.bateau.create.mockResolvedValue({
        id: 1,
        nom: bateauData.nomBateau,
        slug: 'mon-bateau-test',
        modele: bateauData.modeleMarque,
        portdefault: bateauData.portattache,
        typeBateau: bateauData.typeBateau,
        description: bateauData.description,
        datesIndisponibles: '[]',
        proprietaireId: bateauData.proprietaireId
      });

      const response = await request(app)
        .post('/api/bateaux')
        .send(bateauData);

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.bateauId).toBe(1);
    });

    it('devrait retourner une erreur 500 en cas d\'échec de création', async () => {
      prisma.bateau.create.mockRejectedValue(new Error('Erreur DB'));

      const response = await request(app)
        .post('/api/bateaux')
        .send({ nomBateau: 'Test' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erreur lors de la création du bateau');
    });
  });

  describe('GET /api/bateaux', () => {
    it('devrait retourner la liste de tous les bateaux', async () => {
      const bateauxMock = [
        {
          id: 1,
          nom: 'Bateau 1',
          details: { longueur: 12.5 },
          medias: [],
          proprietaire: { nom: 'Proprio 1' }
        }
      ];

      prisma.bateau.findMany.mockResolvedValue(bateauxMock);

      const response = await request(app).get('/api/bateaux');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bateaux).toEqual(bateauxMock);
    });

    it('devrait retourner une erreur 500 en cas d\'échec', async () => {
      prisma.bateau.findMany.mockRejectedValue(new Error('Erreur DB'));

      const response = await request(app).get('/api/bateaux');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erreur lors de la récupération des bateaux');
    });
  });

  describe('GET /api/bateaux/:id', () => {
    it('devrait retourner un bateau spécifique par ID', async () => {
      const bateauMock = {
        id: 1,
        nom: 'Bateau Test',
        details: { longueur: 12.5 },
        medias: [],
        proprietaire: { nom: 'Proprio Test' }
      };

      prisma.bateau.findUnique.mockResolvedValue(bateauMock);

      const response = await request(app).get('/api/bateaux/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bateau).toEqual(bateauMock);
    });

    it('devrait retourner 404 si le bateau n\'est pas trouvé', async () => {
      prisma.bateau.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/bateaux/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Bateau non trouvé');
    });

    it('devrait retourner 500 en cas d\'erreur serveur', async () => {
      prisma.bateau.findUnique.mockRejectedValue(new Error('Erreur DB'));

      const response = await request(app).get('/api/bateaux/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erreur lors de la récupération du bateau');
    });
  });

  describe('GET /api/bateaux/slug/:slug', () => {
    it('devrait retourner un bateau par son slug', async () => {
      const bateauMock = {
        id: 1,
        slug: 'mon-bateau-test',
        nom: 'Mon Bateau Test',
        details: { longueur: 12.5 },
        medias: [],
        proprietaire: { nom: 'Proprio Test' }
      };

      prisma.bateau.findUnique.mockResolvedValue(bateauMock);

      const response = await request(app).get('/api/bateaux/slug/mon-bateau-test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bateau).toEqual(bateauMock);
    });

    it('devrait retourner 404 si le bateau n\'est pas trouvé par slug', async () => {
      prisma.bateau.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/bateaux/slug/slug-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Bateau non trouvé');
    });
  });

  describe('PUT /api/bateaux/:id', () => {
    it('devrait mettre à jour un bateau existant', async () => {
      const bateauExistant = {
        id: 1,
        details: { id: 1 }
      };

      const updateData = {
        nomBateau: 'Bateau Modifié',
        modeleMarque: 'Nouveau Modèle'
      };

      prisma.bateau.findUnique.mockResolvedValue(bateauExistant);
      prisma.bateau.update.mockResolvedValue({
        ...bateauExistant,
        nom: updateData.nomBateau
      });

      const response = await request(app)
        .put('/api/bateaux/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('devrait retourner 404 si le bateau à mettre à jour n\'existe pas', async () => {
      prisma.bateau.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/bateaux/999')
        .send({ nomBateau: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Bateau non trouvé');
    });
  });

  describe('DELETE /api/bateaux/slug/:slug', () => {
    it('devrait supprimer un bateau par son slug', async () => {
      const bateauMock = { id: 1, slug: 'mon-bateau' };
      
      prisma.bateau.findUnique.mockResolvedValue(bateauMock);
      prisma.detailsBateau.deleteMany.mockResolvedValue({ count: 1 });
      prisma.bateau.delete.mockResolvedValue(bateauMock);

      const response = await request(app).delete('/api/bateaux/slug/mon-bateau');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Bateau supprimé avec succès');
    });

    it('devrait retourner 404 si le bateau à supprimer n\'existe pas', async () => {
      prisma.bateau.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/bateaux/slug/slug-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Bateau non trouvé');
    });
  });

  describe('GET /api/bateaux/proprietaire/:proprietaireId', () => {
    it('devrait retourner les bateaux d\'un propriétaire', async () => {
      const bateauxMock = [
        { id: 1, nom: 'Bateau 1', proprietaireId: 1 }
      ];

      prisma.bateau.findMany.mockResolvedValue(bateauxMock);

      const response = await request(app).get('/api/bateaux/proprietaire/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bateaux).toEqual(bateauxMock);
    });

    it('devrait retourner un tableau vide si aucun bateau trouvé', async () => {
      prisma.bateau.findMany.mockResolvedValue([]);

      const response = await request(app).get('/api/bateaux/proprietaire/999');

      expect(response.status).toBe(200);
      expect(response.body.bateaux).toEqual([]);
    });
  });
});