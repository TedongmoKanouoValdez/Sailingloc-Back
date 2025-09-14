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

// Mock manuel de Cloudinary
const mockUploadStream = jest.fn();
const mockCloudinary = {
  uploader: {
    upload_stream: mockUploadStream,
  },
};

jest.mock("../../../utils/cloudinaryConfig", () => {
  return mockCloudinary;
});

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

  describe("uploadRecuService", () => {
    it("devrait rejeter si paiement non trouvé", async () => {
      // Arrange
      const fileBuffer = Buffer.from("test");
      const fileName = "recu.pdf";
      const reservationId = "1";

      prismaInstance.paiement.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        recuService.uploadRecuService(fileBuffer, fileName, reservationId)
      ).rejects.toThrow("Paiement non trouvé");
    });

    it("devrait rejeter si reçu existe déjà", async () => {
      // Arrange
      const fileBuffer = Buffer.from("test");
      const fileName = "recu.pdf";
      const reservationId = "1";

      const mockPaiement = {
        id: 1,
        recu: { id: 1 }, // Un reçu existe déjà
      };

      prismaInstance.paiement.findUnique.mockResolvedValue(mockPaiement);

      // Act & Assert
      await expect(
        recuService.uploadRecuService(fileBuffer, fileName, reservationId)
      ).rejects.toThrow("Un reçu existe déjà pour ce paiement");
    });
  });
});
