// tests/unitaires/services/reservationService.test.js

// Mock GLOBAL de Prisma AVANT l'import du service
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    reservation: {
      findFirst: jest.fn(),
      create: jest.fn()
    },
    bateau: {
      findUnique: jest.fn()
    },
    message: {
      create: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {
      Decimal: jest.fn((value) => value)
    }
  };
});

// Maintenant importer les modules
const { PrismaClient, Prisma } = require('@prisma/client');
const reservationService = require('../../../services/reservationService');

describe('Reservation Service', () => {
  let prismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Récupérer l'instance mockée de Prisma
    prismaInstance = new PrismaClient();
  });

  describe('createReservation', () => {
    it('devrait créer une réservation avec succès', async () => {
      // Arrange
      const reservationData = {
        utilisateurId: 1,
        bateauId: 1,
        bateaunom: 'Bateau Test',
        dateDebut: '2024-01-01',
        dateFin: '2024-01-05',
        plage: 'Plage Test',
        numbreDePassage: 4,
        supplement: 50,
        prixDeBase: 500,
        prixSupplementPassagers: 100,
        prixOptionsPayantes: 50,
        Total: 650,
        heure: '14:00'
      };
      
      const mockReservation = {
        id: 1,
        ...reservationData,
        prixDeBase: 500,
        prixSupplementPassagers: 100,
        prixOptionsPayantes: 50,
        Total: 650,
        statut: 'EN_ATTENTE'
      };
      
      const mockBateau = {
        id: 1,
        nom: 'Bateau Test',
        proprietaire: { id: 2 }
      };

      // Mocks
      prismaInstance.reservation.findFirst.mockResolvedValue(null);
      prismaInstance.reservation.create.mockResolvedValue(mockReservation);
      prismaInstance.bateau.findUnique.mockResolvedValue(mockBateau);
      prismaInstance.message.create.mockResolvedValue({});

      // Act
      const result = await reservationService.createReservation(reservationData);

      // Assert
      expect(prismaInstance.reservation.findFirst).toHaveBeenCalledWith({
        where: {
          utilisateurId: 1,
          bateauId: 1,
          OR: [{
            dateDebut: { lte: new Date('2024-01-05') },
            dateFin: { gte: new Date('2024-01-01') }
          }]
        }
      });
      expect(result).toEqual(mockReservation);
    });

    it('devrait rejeter si réservation existe déjà', async () => {
      // Arrange
      const reservationData = {
        utilisateurId: 1,
        bateauId: 1,
        dateDebut: '2024-01-01',
        dateFin: '2024-01-05'
      };
      
      const mockExistingReservation = {
        id: 1,
        utilisateurId: 1,
        bateauId: 1
      };
      
      prismaInstance.reservation.findFirst.mockResolvedValue(mockExistingReservation);

      // Act & Assert
      await expect(reservationService.createReservation(reservationData))
        .rejects.toThrow('Vous avez déjà une réservation pour ce bateau à ces dates.');
    });

    it('devrait rejeter si bateau non trouvé', async () => {
      // Arrange
      const reservationData = {
        utilisateurId: 1,
        bateauId: 999,
        bateaunom: 'Bateau Test',
        dateDebut: '2024-01-01',
        dateFin: '2024-01-05'
      };
      
      prismaInstance.reservation.findFirst.mockResolvedValue(null);
      prismaInstance.reservation.create.mockResolvedValue({ id: 1 });
      prismaInstance.bateau.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(reservationService.createReservation(reservationData))
        .rejects.toThrow('Impossible de récupérer le bateau !');
    });

    it('devrait gérer les champs optionnels manquants', async () => {
      // Arrange
      const reservationData = {
        utilisateurId: 1,
        bateauId: 1,
        bateaunom: 'Bateau Test',
        dateDebut: '2024-01-01',
        dateFin: '2024-01-05'
        // Champs optionnels manquants
      };
      
      const mockReservation = {
        id: 1,
        ...reservationData,
        prixDeBase: 0,
        prixSupplementPassagers: 0,
        prixOptionsPayantes: 0,
        Total: 0,
        statut: 'EN_ATTENTE'
      };
      
      const mockBateau = {
        id: 1,
        nom: 'Bateau Test',
        proprietaire: { id: 2 }
      };

      prismaInstance.reservation.findFirst.mockResolvedValue(null);
      prismaInstance.reservation.create.mockResolvedValue(mockReservation);
      prismaInstance.bateau.findUnique.mockResolvedValue(mockBateau);
      prismaInstance.message.create.mockResolvedValue({});

      // Act
      await reservationService.createReservation(reservationData);

      // Assert
      expect(prismaInstance.reservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          plage: null,
          numbreDePassage: null,
          supplement: null,
          heure: null
        })
      });
    });

    it('devrait créer un message de confirmation', async () => {
      // Arrange
      const reservationData = {
        utilisateurId: 1,
        bateauId: 1,
        bateaunom: 'Bateau Test',
        dateDebut: '2024-01-01',
        dateFin: '2024-01-05'
      };
      
      const mockReservation = { id: 1 };
      const mockBateau = {
        id: 1,
        nom: 'Bateau Test',
        proprietaire: { id: 2 }
      };

      prismaInstance.reservation.findFirst.mockResolvedValue(null);
      prismaInstance.reservation.create.mockResolvedValue(mockReservation);
      prismaInstance.bateau.findUnique.mockResolvedValue(mockBateau);
      prismaInstance.message.create.mockResolvedValue({});

      // Act
      await reservationService.createReservation(reservationData);

      // Assert
      expect(prismaInstance.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          expediteurId: 1,
          destinataireId: 2,
          reservationId: 1,
          contenu: expect.stringContaining('Votre réservation du bateau "Bateau Test"'),
          object: 'Confirmation de réservation - Bateau Test'
        })
      });
    });

    it('devrait gérer les bateaux sans propriétaire', async () => {
      // Arrange
      const reservationData = {
        utilisateurId: 1,
        bateauId: 1,
        bateaunom: 'Bateau Test',
        dateDebut: '2024-01-01',
        dateFin: '2024-01-05'
      };
      
      const mockReservation = { id: 1 };
      const mockBateau = {
        id: 1,
        nom: 'Bateau Test',
        proprietaire: null // Pas de propriétaire
      };

      prismaInstance.reservation.findFirst.mockResolvedValue(null);
      prismaInstance.reservation.create.mockResolvedValue(mockReservation);
      prismaInstance.bateau.findUnique.mockResolvedValue(mockBateau);
      prismaInstance.message.create.mockResolvedValue({});

      // Act
      await reservationService.createReservation(reservationData);

      // Assert - destinataireId devrait être null
      expect(prismaInstance.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          destinataireId: null
        })
      });
    });
  });
});