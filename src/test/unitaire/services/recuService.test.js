// tests/unitaires/services/recuService.test.js

// Mock GLOBAL de toutes les dépendances AVANT l'import du service
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    paiement: {
      findUnique: jest.fn(),
    },
    recu: {
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

jest.mock("../../../utils/cloudinaryConfig", () => ({
  uploader: {
    upload_stream: jest.fn(),
  },
}));

jest.mock("streamifier", () => ({
  createReadStream: jest.fn(() => ({
    pipe: jest.fn(),
  })),
}));

// Maintenant importer les modules
const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../../../utils/cloudinaryConfig");
const streamifier = require("streamifier");
const recuService = require("../../../services/recuService");

describe("Recu Service", () => {
  let prismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer l'instance mockée de Prisma
    prismaInstance = new PrismaClient();
  });

  describe('uploadRecuService', () => {
    it('devrait uploader un reçu avec succès', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test');
      const fileName = 'recu.pdf';
      const reservationId = '1';
      
      const mockPaiement = {
        id: 1,
        recu: null,
      };
      
      const mockCloudinaryResult = {
        secure_url: 'https://cloudinary.com/recu.pdf',
      };
      
      const mockRecu = {
        id: 1,
        paiementId: 1,
      };

      prismaInstance.paiement.findUnique.mockResolvedValue(mockPaiement);
      
      // Mock de upload_stream
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, mockCloudinaryResult);
        return {
          end: jest.fn(),
        };
      });
      
      prismaInstance.recu.create.mockResolvedValue(mockRecu);

      // Act
      const result = await recuService.uploadRecuService(fileBuffer, fileName, reservationId);

      // Assert
      expect(prismaInstance.paiement.findUnique).toHaveBeenCalledWith({
        where: { reservationId: 1 },
        include: { recu: true },
      });
      
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
      expect(streamifier.createReadStream).toHaveBeenCalledWith(fileBuffer);
      
      expect(prismaInstance.recu.create).toHaveBeenCalledWith({
        data: {
          paiementId: 1,
          media: {
            create: {
              url: 'https://cloudinary.com/recu.pdf',
              type: "RECUS",
              titre: "Reçu de paiement",
            },
          },
        },
      });
      
      expect(result).toEqual({
        url: 'https://cloudinary.com/recu.pdf',
        recuId: 1,
      });
    });

    it('devrait rejeter si paiement non trouvé', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test');
      const fileName = 'recu.pdf';
      const reservationId = '1';
      
      prismaInstance.paiement.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(recuService.uploadRecuService(fileBuffer, fileName, reservationId))
        .rejects.toThrow("Paiement non trouvé");
    });

    it('devrait rejeter si reçu existe déjà', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test');
      const fileName = 'recu.pdf';
      const reservationId = '1';
      
      const mockPaiement = {
        id: 1,
        recu: { id: 1 }, // Un reçu existe déjà
      };

      prismaInstance.paiement.findUnique.mockResolvedValue(mockPaiement);

      // Act & Assert
      await expect(recuService.uploadRecuService(fileBuffer, fileName, reservationId))
        .rejects.toThrow("Un reçu existe déjà pour ce paiement");
    });

    it('devrait NE PAS supprimer le fichier en cas d erreur Cloudinary', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test');
      const fileName = 'recu.pdf';
      const reservationId = '1';
      
      const mockPaiement = {
        id: 1,
        recu: null,
      };
      
      prismaInstance.paiement.findUnique.mockResolvedValue(mockPaiement);
      
      // Mock de upload_stream avec erreur
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(new Error('Erreur Cloudinary'), null);
        return {
          end: jest.fn(),
        };
      });

      // Act & Assert
      await expect(recuService.uploadRecuService(fileBuffer, fileName, reservationId))
        .rejects.toThrow('Erreur Cloudinary');
    });

    it('devrait NE PAS supprimer le fichier en cas d erreur de création en base', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test');
      const fileName = 'recu.pdf';
      const reservationId = '1';
      
      const mockPaiement = {
        id: 1,
        recu: null,
      };
      
      const mockCloudinaryResult = {
        secure_url: 'https://cloudinary.com/recu.pdf',
      };
      
      prismaInstance.paiement.findUnique.mockResolvedValue(mockPaiement);
      
      // Mock de upload_stream
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, mockCloudinaryResult);
        return {
          end: jest.fn(),
        };
      });
      
      prismaInstance.recu.create.mockRejectedValue(new Error('Erreur DB'));

      // Act & Assert
      await expect(recuService.uploadRecuService(fileBuffer, fileName, reservationId))
        .rejects.toThrow('Erreur DB');
    });
  });
});