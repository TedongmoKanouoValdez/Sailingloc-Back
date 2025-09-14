// tests/unitaires/services/paiementService.test.js

// Mock GLOBAL de Prisma AVANT l'import du service
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    paiement: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    message: {
      create: jest.fn()
    },
    $transaction: jest.fn(async (callback) => await callback(mockPrisma))
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    EtatPaiement: { PAYE: 'PAYE', EN_ATTENTE: 'EN_ATTENTE', ECHEC: 'ECHEC' },
    StatutReservation: { CONFIRMEE: 'CONFIRMEE', EN_ATTENTE: 'EN_ATTENTE' },
    Prisma: {
      Decimal: jest.fn((value) => value)
    }
  };
});

// Maintenant importer les modules
const { PrismaClient, EtatPaiement, StatutReservation, Prisma } = require('@prisma/client');
const paiementService = require('../../../services/paiementService');

describe('Paiement Service', () => {
  let prismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Récupérer l'instance mockée de Prisma
    prismaInstance = new PrismaClient();
  });

  describe('createPaiement', () => {
    it('devrait créer un paiement avec succès', async () => {
      // Arrange
      const paiementData = {
        reservationId: 1,
        montant: 100,
        montantTotal: 120,
        methodePaiement: 'CARD',
        pourcentageStripe: 2.5,
        etatPaiement: 'PAYE'
      };
      
      const mockReservation = {
        id: 1,
        utilisateurId: 2,
        proprietaireId: 3,
        bateauId: 4,
        statut: 'EN_ATTENTE',
        bateau: { id: 4, nom: 'Bateau Test' },
        contrat: { id: 5 },
        messages: []
      };
      
      const mockPaiement = {
        id: 1,
        ...paiementData,
        montant: 100,
        montantTotal: 120,
        pourcentageStripe: 2.5
      };

      // Mocks
      prismaInstance.reservation.findUnique.mockResolvedValue(mockReservation);
      prismaInstance.paiement.findUnique.mockResolvedValue(null);
      prismaInstance.paiement.create.mockResolvedValue(mockPaiement);
      prismaInstance.reservation.update.mockResolvedValue({});
      prismaInstance.message.create.mockResolvedValue({});

      // Act
      const result = await paiementService.createPaiement(paiementData);

      // Assert
      expect(prismaInstance.reservation.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { bateau: true, contrat: true, messages: true }
      });
      expect(result).toEqual(mockPaiement);
    });

    it('devrait rejeter si réservation introuvable', async () => {
      // Arrange
      const paiementData = {
        reservationId: 999,
        montant: 100,
        etatPaiement: 'PAYE'
      };
      
      prismaInstance.reservation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(paiementService.createPaiement(paiementData))
        .rejects.toThrow('Réservation introuvable');
    });

    it('devrait rejeter si paiement existe déjà', async () => {
      // Arrange
      const paiementData = {
        reservationId: 1,
        montant: 100,
        etatPaiement: 'PAYE'
      };
      
      const mockReservation = { id: 1 };
      const mockExistingPaiement = { id: 1, reservationId: 1 };
      
      prismaInstance.reservation.findUnique.mockResolvedValue(mockReservation);
      prismaInstance.paiement.findUnique.mockResolvedValue(mockExistingPaiement);

      // Act & Assert
      await expect(paiementService.createPaiement(paiementData))
        .rejects.toThrow('Paiement déjà enregistré pour cette réservation');
    });

    it('devrait rejeter si etatPaiement invalide', async () => {
      // Arrange
      const paiementData = {
        reservationId: 1,
        montant: 100,
        etatPaiement: 'INVALIDE'
      };
      
      const mockReservation = { id: 1 };
      
      prismaInstance.reservation.findUnique.mockResolvedValue(mockReservation);
      prismaInstance.paiement.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(paiementService.createPaiement(paiementData))
        .rejects.toThrow('etatPaiement invalide');
    });

    it('devrait confirmer la réservation si PAYE', async () => {
      // Arrange
      const paiementData = {
        reservationId: 1,
        montant: 100,
        etatPaiement: 'PAYE'
      };
      
      const mockReservation = {
        id: 1,
        utilisateurId: 2,
        proprietaireId: 3,
        bateauId: 4,
        statut: 'EN_ATTENTE'
      };
      
      prismaInstance.reservation.findUnique.mockResolvedValue(mockReservation);
      prismaInstance.paiement.findUnique.mockResolvedValue(null);
      prismaInstance.paiement.create.mockResolvedValue({ id: 1 });
      prismaInstance.reservation.update.mockResolvedValue({});
      prismaInstance.message.create.mockResolvedValue({});

      // Act
      await paiementService.createPaiement(paiementData);

      // Assert
      expect(prismaInstance.reservation.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { statut: 'CONFIRMEE' }
      });
    });

    it('devrait créer un message de confirmation si PAYE', async () => {
      // Arrange
      const paiementData = {
        reservationId: 1,
        montant: 100,
        montantTotal: 120,
        etatPaiement: 'PAYE'
      };
      
      const mockReservation = {
        id: 1,
        utilisateurId: 2,
        proprietaireId: 3,
        bateauId: 4,
        statut: 'EN_ATTENTE'
      };
      
      prismaInstance.reservation.findUnique.mockResolvedValue(mockReservation);
      prismaInstance.paiement.findUnique.mockResolvedValue(null);
      prismaInstance.paiement.create.mockResolvedValue({ id: 1 });
      prismaInstance.reservation.update.mockResolvedValue({});
      prismaInstance.message.create.mockResolvedValue({});

      // Act
      await paiementService.createPaiement(paiementData);

      // Assert
      expect(prismaInstance.message.create).toHaveBeenCalledWith({
        data: {
          expediteurId: 2,
          destinataireId: 3,
          reservationId: 1,
          bateauId: 4,
          contenu: 'Le paiement de 120 € a été confirmé.',
          object: 'Confirmation de paiement',
          dateEnvoi: expect.any(Date)
        }
      });
    });

    it('devrait gérer les erreurs de transaction', async () => {
      // Arrange
      const paiementData = {
        reservationId: 1,
        montant: 100,
        etatPaiement: 'PAYE'
      };
      
      const mockReservation = { id: 1 };
      
      prismaInstance.reservation.findUnique.mockResolvedValue(mockReservation);
      prismaInstance.paiement.findUnique.mockResolvedValue(null);
      prismaInstance.$transaction.mockRejectedValue(new Error('Erreur DB'));

      // Act & Assert
      await expect(paiementService.createPaiement(paiementData))
        .rejects.toThrow('Erreur DB');
    });
  });
});