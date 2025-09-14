// commentaireController.test.js
const commentaireController = require('../../../controllers/commentaireController');

// Mock du prismaClient
jest.mock('../../../utils/prismaClient', () => {
  const mockPrisma = {
    commentaire: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn()
    },
    utilisateur: {
      findUnique: jest.fn()
    }
  };
  
  return mockPrisma;
});

const prisma = require('../../../utils/prismaClient');

describe('Commentaire Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      query: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  describe('getCommentaires', () => {
    it('devrait récupérer tous les commentaires', async () => {
      // Arrange
      const mockCommentaires = [
        {
          id: 1,
          contenu: 'Excellent service',
          auteur: { id: 1, nom: 'Doe', prenom: 'John' }
        }
      ];
      
      prisma.commentaire.findMany.mockResolvedValue(mockCommentaires);

      // Act
      await commentaireController.getCommentaires(req, res);

      // Assert
      expect(prisma.commentaire.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          auteur: {
            select: { 
              id: true, 
              nom: true, 
              prenom: true, 
              photoProfil: true, 
              email: true, 
              telephone: true 
            }
          }
        },
        orderBy: { creeLe: 'desc' }
      });
      expect(res.json).toHaveBeenCalledWith(mockCommentaires);
    });

    it('devrait récupérer les commentaires avec un bateauId spécifique', async () => {
      // Arrange
      req.query = { bateauId: '1' };
      const mockCommentaires = [
        {
          id: 1,
          contenu: 'Excellent service',
          bateauId: 1
        }
      ];
      
      prisma.commentaire.findMany.mockResolvedValue(mockCommentaires);

      // Act
      await commentaireController.getCommentaires(req, res);

      // Assert
      expect(prisma.commentaire.findMany).toHaveBeenCalledWith({
        where: { bateauId: 1 },
        include: expect.any(Object),
        orderBy: { creeLe: 'desc' }
      });
      expect(res.json).toHaveBeenCalledWith(mockCommentaires);
    });

    it('devrait gérer les erreurs de récupération des commentaires', async () => {
      // Arrange
      const errorMessage = 'Erreur base de données';
      prisma.commentaire.findMany.mockRejectedValue(new Error(errorMessage));

      // Act
      await commentaireController.getCommentaires(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
    });
  });

  describe('createCommentaire', () => {
    it('devrait créer un commentaire avec succès', async () => {
      // Arrange
      req.body = {
        contenu: 'Excellent service',
        note: 5,
        auteurId: 1,
        bateauId: 1,
        reservationId: 1
      };
      
      const mockCommentaire = {
        id: 1,
        contenu: 'Excellent service',
        note: 5,
        auteurId: 1,
        bateauId: 1,
        reservationId: 1
      };
      
      prisma.commentaire.create.mockResolvedValue(mockCommentaire);

      // Act
      await commentaireController.createCommentaire(req, res);

      // Assert
      expect(prisma.commentaire.create).toHaveBeenCalledWith({
        data: {
          contenu: 'Excellent service',
          note: 5,
          auteurId: 1,
          bateauId: 1,
          reservationId: 1
        }
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCommentaire);
    });

    it('devrait utiliser la note par défaut si non fournie', async () => {
      // Arrange
      req.body = {
        contenu: 'Bon service',
        note: 1, // Note fournie
        auteurId: 1
      };
      
      const mockCommentaire = {
        id: 1,
        contenu: 'Bon service',
        note: 1,
        auteurId: 1
      };
      
      prisma.commentaire.create.mockResolvedValue(mockCommentaire);

      // Act
      await commentaireController.createCommentaire(req, res);

      // Assert
      expect(prisma.commentaire.create).toHaveBeenCalledWith({
        data: {
          contenu: 'Bon service',
          note: 1,
          auteurId: 1,
          bateauId: undefined,
          reservationId: undefined
        }
      });
    });

    it('devrait retourner une erreur si données manquantes', async () => {
      // Arrange
      req.body = {
        auteurId: 1
        // contenu et note manquants
      };

      // Act
      await commentaireController.createCommentaire(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Données manquantes' });
    });

    it('devrait gérer les erreurs de création de commentaire', async () => {
      // Arrange
      req.body = {
        contenu: 'Excellent service',
        note: 5,
        auteurId: 1
      };
      
      prisma.commentaire.create.mockRejectedValue(new Error('Erreur DB'));

      // Act
      await commentaireController.createCommentaire(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur création commentaire' });
    });
  });
});