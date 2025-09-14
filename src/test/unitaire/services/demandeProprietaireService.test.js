const { PrismaClient } = require('@prisma/client');

// Mock l'import entier de @prisma/client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    utilisateur: {
      findFirst: jest.fn(),
      update: jest.fn()
    },
    demandeProprietaire: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    message: {
      create: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

// Créer un mock complet de dayjs
const mockDayjsInstance = {
  extend: jest.fn(),
  startOf: jest.fn().mockReturnThis(),
  endOf: jest.fn().mockReturnThis(),
  subtract: jest.fn().mockReturnThis(),
  add: jest.fn().mockReturnThis(),
  format: jest.fn(),
  toDate: jest.fn()
};

const mockDayjs = jest.fn(() => mockDayjsInstance);

// Mock de dayjs et ses plugins
jest.mock('dayjs', () => mockDayjs);
jest.mock('dayjs/plugin/utc', () => ({ __esModule: true, default: {} }));
jest.mock('dayjs/plugin/timezone', () => ({ __esModule: true, default: {} }));

// Import APRÈS les mocks
const demandeService = require('../../../services/demandeProprietaireService');

describe('Demande Service', () => {
  let prismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Récupérer l'instance mockée
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient();
    
    // Réinitialiser le mock dayjs
    mockDayjs.mockReturnValue(mockDayjsInstance);
    
    // Configurer les méthodes de base
    mockDayjsInstance.startOf.mockReturnThis();
    mockDayjsInstance.endOf.mockReturnThis();
    mockDayjsInstance.subtract.mockReturnThis();
    mockDayjsInstance.add.mockReturnThis();
  });

  // Mock manuellement l'extend avant chaque test
  beforeAll(() => {
    // Simuler l'appel à extend dans le service
    require('../../../services/demandeProprietaireService');
  });

  describe('createDemande', () => {
    it('devrait créer une demande valide', async () => {
      // Arrange
      const userId = 1;
      const payload = { raison: 'Test' };
      
      const todayStart = new Date('2024-01-01T00:00:00.000Z');
      const todayEnd = new Date('2024-01-01T23:59:59.999Z');
      const sevenDaysAgo = new Date('2023-12-25T00:00:00.000Z');
      
      // Configurer les retours de toDate
      mockDayjsInstance.toDate
        .mockReturnValueOnce(todayStart)   // todayStart
        .mockReturnValueOnce(todayEnd)     // todayEnd
        .mockReturnValueOnce(sevenDaysAgo); // sevenDaysAgo

      // Mocks Prisma - aucune demande existante
      prismaInstance.demandeProprietaire.findFirst
        .mockResolvedValueOnce(null) // todayDemand
        .mockResolvedValueOnce(null); // lastDemand
        
      prismaInstance.demandeProprietaire.create.mockResolvedValue({ 
        id: 1, 
        data: JSON.stringify(payload),
        statut: 'EN_ATTENTE'
      });

      // Act
      const result = await demandeService.createDemande(userId, payload);

      // Assert
      expect(result).toBeDefined();
      expect(prismaInstance.demandeProprietaire.create).toHaveBeenCalled();
    });
    
  });

  describe('notifyAdmin', () => {
    it('devrait notifier l\'admin avec succès', async () => {
      // Arrange
      const userId = 1;
      const demandeId = 1;
      const nomComplet = 'John Doe';
      
      const mockAdmin = { id: 2 };
      prismaInstance.utilisateur.findFirst.mockResolvedValue(mockAdmin);
      prismaInstance.message.create.mockResolvedValue({ id: 1 });

      // Act
      const result = await demandeService.notifyAdmin(userId, demandeId, nomComplet);

      // Assert
      expect(prismaInstance.utilisateur.findFirst).toHaveBeenCalledWith({
        where: { role: "ADMIN" }
      });
      expect(result).toEqual({ id: 1 });
    });

    it('devrait throw une erreur si aucun admin trouvé', async () => {
      // Arrange
      const userId = 1;
      const demandeId = 1;
      const nomComplet = 'John Doe';
      
      prismaInstance.utilisateur.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(demandeService.notifyAdmin(userId, demandeId, nomComplet))
        .rejects.toThrow("Aucun administrateur trouvé");
    });
  });

  describe('updateStatut', () => {
    it('devrait accepter une demande et mettre à jour le rôle', async () => {
      // Arrange
      const demandeId = 1;
      const mockDemande = {
        id: 1,
        utilisateur: { id: 2 },
        statut: 'EN_ATTENTE'
      };
      
      prismaInstance.demandeProprietaire.findUnique.mockResolvedValue(mockDemande);
      prismaInstance.utilisateur.update.mockResolvedValue({});
      prismaInstance.message.create.mockResolvedValue({});
      prismaInstance.demandeProprietaire.update.mockResolvedValue({ id: 1 });

      // Act
      const result = await demandeService.updateStatut(demandeId, 'ACCEPTEE');

      // Assert
      expect(prismaInstance.utilisateur.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { role: "PROPRIETAIRE" }
      });
    });
  });
});