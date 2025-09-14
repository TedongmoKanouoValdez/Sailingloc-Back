jest.mock('@prisma/client', () => {
  const mockPrisma = {
    utilisateur: {
      findUnique: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

// Maintenant importer les modules
const utilisateurController = require('../../../controllers/utilisateurController');
const utilisateurService = require('../../../services/utilisateurService');

// Mock des autres dépendances
jest.mock('../../../services/utilisateurService');

// Mock des console
console.log = jest.fn();
console.error = jest.fn();

describe('Utilisateur Controller', () => {
  let req, res, next;
  let mockPrismaInstance;

  beforeEach(() => {
    // Récupérer l'instance mockée de Prisma
    const { PrismaClient } = require('@prisma/client');
    mockPrismaInstance = new PrismaClient();
    
    req = {
      body: {},
      params: {},
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('createUtilisateur', () => {
    it('devrait créer un utilisateur avec succès', async () => {
      // Arrange
      req.body = {
        nom: 'Doe',
        prenom: 'John',
        email: 'john@example.com',
        telephone: '0123456789'
      };
      req.file = { path: '/tmp/photo.jpg' };
      
      // Mock de la vérification d'email
      mockPrismaInstance.utilisateur.findUnique.mockResolvedValue(null);
      
      const mockUser = { 
        id: 1, 
        nom: 'Doe', 
        email: 'john@example.com'
      };
      utilisateurService.createUserWithPhoto.mockResolvedValue(mockUser);

      // Act
      await utilisateurController.createUtilisateur(req, res, next);

      // Assert
      expect(mockPrismaInstance.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' }
      });
      expect(utilisateurService.createUserWithPhoto).toHaveBeenCalledWith(
        req.body, 
        req.file
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Utilisateur créé",
        utilisateur: mockUser
      });
    }); // ← ICI : accolade fermante CORRECTE

    it('devrait normaliser l\'email en minuscules', async () => {
      // Arrange
      req.body = { 
        nom: 'Doe',
        prenom: 'John', 
        email: 'John@Example.COM', // Email avec majuscules
        telephone: '0123456789'
      };
      req.file = { path: '/tmp/photo.jpg' };
      
      // Mock de la vérification d'email existant
      mockPrismaInstance.utilisateur.findUnique.mockResolvedValue(null);
      
      // Mock du service
      const mockUser = { 
        id: 1, 
        nom: 'Doe', 
        email: 'john@example.com' // Email normalisé
      };
      utilisateurService.createUserWithPhoto.mockResolvedValue(mockUser);

      // Act
      await utilisateurController.createUtilisateur(req, res, next);

      // Assert - Vérifier que l'email est normalisé pour la recherche
      expect(mockPrismaInstance.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' } // Doit être en minuscules
      });
    });

    it('devrait retourner une erreur 400 si pas de photo', async () => {
      // Arrange
      req.body = { email: 'test@example.com' };
      req.file = null;

      // Act
      await utilisateurController.createUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Photo de profil requise" 
      });
      expect(utilisateurService.createUserWithPhoto).not.toHaveBeenCalled();
    });

    it('devrait retourner une erreur 409 si email existe déjà', async () => {
      // Arrange
      req.body = { email: 'existant@example.com' };
      req.file = { path: '/tmp/photo.jpg' };
      
      // Mock: l'email existe déjà
      mockPrismaInstance.utilisateur.findUnique.mockResolvedValue({ 
        id: 2, 
        email: 'existant@example.com' 
      });

      // Act
      await utilisateurController.createUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Cet email est déjà utilisé" 
      });
      expect(utilisateurService.createUserWithPhoto).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs P2002 de Prisma (email unique)', async () => {
      // Arrange
      req.body = { email: 'test@example.com' };
      req.file = { path: '/tmp/photo.jpg' };
      
      // Mock: pas d'email existant en vérification manuelle
      mockPrismaInstance.utilisateur.findUnique.mockResolvedValue(null);
      
      // Mais le service lance une erreur Prisma
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] }
      };
      utilisateurService.createUserWithPhoto.mockRejectedValue(prismaError);

      // Act
      await utilisateurController.createUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Cet email est déjà utilisé" 
      });
    });

    it('devrait gérer les erreurs P2002 de Prisma (téléphone unique)', async () => {
      // Arrange
      req.body = { email: 'test@example.com', telephone: '0123456789' };
      req.file = { path: '/tmp/photo.jpg' };
      
      // Mock: pas d'email existant
      mockPrismaInstance.utilisateur.findUnique.mockResolvedValue(null);
      
      // Mais le service lance une erreur Prisma pour le téléphone
      const prismaError = {
        code: 'P2002',
        meta: { target: ['telephone'] }
      };
      utilisateurService.createUserWithPhoto.mockRejectedValue(prismaError);

      // Act
      await utilisateurController.createUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Ce numéro de téléphone est déjà utilisé" 
      });
    });

    it('devrait gérer les erreurs générales', async () => {
      // Arrange
      req.body = { email: 'test@example.com' };
      req.file = { path: '/tmp/photo.jpg' };
      
      // Mock: pas d'email existant
      mockPrismaInstance.utilisateur.findUnique.mockResolvedValue(null);
      
      // Le service lance une erreur générale
      const generalError = new Error('Erreur inconnue');
      utilisateurService.createUserWithPhoto.mockRejectedValue(generalError);

      // Act
      await utilisateurController.createUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Erreur lors de la création de l'utilisateur" 
      });
    });
  });

  describe('updateUtilisateur', () => {
    it('devrait mettre à jour un utilisateur avec succès', async () => {
      // Arrange
      req.params.id = '1';
      req.body = { nom: 'NouveauNom', email: 'new@example.com' };
      req.file = { path: '/tmp/new-photo.jpg' };
      
      const mockUpdatedUser = { 
        id: 1, 
        nom: 'NouveauNom', 
        email: 'new@example.com' 
      };
      utilisateurService.updateUserWithPhoto.mockResolvedValue(mockUpdatedUser);

      // Act
      await utilisateurController.updateUtilisateur(req, res, next);

      // Assert
      expect(utilisateurService.updateUserWithPhoto).toHaveBeenCalledWith(
        '1', 
        { nom: 'NouveauNom', email: 'new@example.com' },
        { path: '/tmp/new-photo.jpg' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Utilisateur mis à jour",
        utilisateur: mockUpdatedUser
      });
    });

    it('devrait gérer les erreurs de contrainte unique lors de la mise à jour', async () => {
      // Arrange
      req.params.id = '1';
      req.body = { email: 'existant@example.com' };
      
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] }
      };
      utilisateurService.updateUserWithPhoto.mockRejectedValue(prismaError);

      // Act
      await utilisateurController.updateUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Cet email est déjà utilisé" 
      });
    });

    it('devrait gérer les erreurs P2025 (enregistrement non trouvé)', async () => {
      // Arrange
      req.params.id = '999'; // ID inexistant
      req.body = { nom: 'NouveauNom' };
      
      const prismaError = {
        code: 'P2025', // Erreur "record not found" de Prisma
        message: 'Aucun enregistrement trouvé'
      };
      utilisateurService.updateUserWithPhoto.mockRejectedValue(prismaError);

      // Act
      await utilisateurController.updateUtilisateur(req, res, next);

      // Assert - Doit retourner 404 pour un enregistrement non trouvé
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Utilisateur non trouvé" 
      });
    });
  });

  describe('deleteUtilisateur', () => {
    it('devrait supprimer un utilisateur avec succès', async () => {
      // Arrange
      req.params.id = '1';
      utilisateurService.deleteUserById.mockResolvedValue();

      // Act
      await utilisateurController.deleteUtilisateur(req, res, next);

      // Assert
      expect(utilisateurService.deleteUserById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Utilisateur supprimé avec succès" 
      });
    });

    it('devrait convertir l\'ID string en number pour la suppression', async () => {
      // Arrange
      req.params.id = '123'; // String
      utilisateurService.deleteUserById.mockResolvedValue();

      // Act
      await utilisateurController.deleteUtilisateur(req, res, next);

      // Assert - Vérifier que le service reçoit un number
      expect(utilisateurService.deleteUserById).toHaveBeenCalledWith(123); // Number
    });

    it('devrait gérer les erreurs de suppression', async () => {
      // Arrange
      req.params.id = '1';
      const errorMessage = 'Erreur de suppression';
      utilisateurService.deleteUserById.mockRejectedValue(new Error(errorMessage));

      // Act
      await utilisateurController.deleteUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: errorMessage 
      });
    });
  });

  describe('getAllUtilisateurs', () => {
    it('devrait retourner tous les utilisateurs', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, nom: 'Doe' },
        { id: 2, nom: 'Smith' }
      ];
      utilisateurService.getAllUtilisateur.mockResolvedValue(mockUsers);

      // Act
      await utilisateurController.getAllUtilisateurs(req, res, next);

      // Assert
      expect(utilisateurService.getAllUtilisateur).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        utilisateurs: mockUsers 
      });
    });

    it('devrait gérer les erreurs de récupération', async () => {
      // Arrange
      utilisateurService.getAllUtilisateur.mockRejectedValue(new Error('DB error'));

      // Act
      await utilisateurController.getAllUtilisateurs(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Erreur serveur lors de la récupération des utilisateurs." 
      });
    });
  });

  describe('getUtilisateur', () => {
    it('devrait retourner un utilisateur spécifique', async () => {
      // Arrange
      req.params.id = '1';
      const mockUser = { id: 1, nom: 'Doe', email: 'doe@example.com' };
      utilisateurService.getUtilisateurById.mockResolvedValue(mockUser);

      // Act
      await utilisateurController.getUtilisateur(req, res, next);

      // Assert
      expect(utilisateurService.getUtilisateurById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('devrait retourner 404 si utilisateur non trouvé', async () => {
      // Arrange
      req.params.id = '999';
      utilisateurService.getUtilisateurById.mockResolvedValue(null);

      // Act
      await utilisateurController.getUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Utilisateur non trouvé" 
      });
    });

    it('devrait gérer les erreurs de récupération', async () => {
      // Arrange
      req.params.id = '1';
      utilisateurService.getUtilisateurById.mockRejectedValue(new Error('DB error'));

      // Act
      await utilisateurController.getUtilisateur(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Erreur serveur lors de la récupération de l'utilisateur." 
      });
    });
  });
});