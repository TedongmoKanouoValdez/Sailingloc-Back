// tests/unitaires/services/messageService.test.js

// Mock GLOBAL de Prisma AVANT l'import du service
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Maintenant importer les modules
const { PrismaClient } = require("@prisma/client");
const messageService = require("../../../services/messageService");

describe("Message Service", () => {
  let prismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer l'instance mockée de Prisma
    prismaInstance = new PrismaClient();
  });

  describe("getMessagesForUser", () => {
    it("devrait récupérer les messages reçus", async () => {
      // Arrange
      const userId = 1;
      const mockMessages = [
        { id: 1, contenu: "Message 1", destinataireId: userId },
        { id: 2, contenu: "Message 2", destinataireId: userId },
      ];

      prismaInstance.message.findMany.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getMessagesForUser(userId, "recus");

      // Assert
      expect(prismaInstance.message.findMany).toHaveBeenCalledWith({
        where: { destinataireId: userId },
        include: {
          expediteur: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          destinataire: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          reservation: true,
          bateau: true,
        },
        orderBy: { dateEnvoi: "desc" },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual(mockMessages);
    });

    it("devrait récupérer les messages envoyés", async () => {
      // Arrange
      const userId = 1;
      const mockMessages = [
        { id: 1, contenu: "Message 1", expediteurId: userId },
        { id: 2, contenu: "Message 2", expediteurId: userId },
      ];

      prismaInstance.message.findMany.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getMessagesForUser(userId, "envoyes");

      // Assert
      expect(prismaInstance.message.findMany).toHaveBeenCalledWith({
        where: { expediteurId: userId },
        include: {
          expediteur: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          destinataire: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          reservation: true,
          bateau: true,
        },
        orderBy: { dateEnvoi: "desc" },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual(mockMessages);
    });

    it("devrait utiliser les paramètres skip et take", async () => {
      // Arrange
      const userId = 1;
      prismaInstance.message.findMany.mockResolvedValue([]);

      // Act
      await messageService.getMessagesForUser(userId, "recus", 10, 5);

      // Assert
      expect(prismaInstance.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });

    it("devrait utiliser le type 'recus' par défaut", async () => {
      // Arrange
      const userId = 1;
      prismaInstance.message.findMany.mockResolvedValue([]);

      // Act
      await messageService.getMessagesForUser(userId);

      // Assert
      expect(prismaInstance.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { destinataireId: userId },
        })
      );
    });

    it("devrait rejeter si userId manquant", async () => {
      // Act & Assert
      await expect(
        messageService.getMessagesForUser(null, "recus")
      ).rejects.toThrow("userId est requis");
    });

    it("devrait rejeter si type invalide", async () => {
      // Act & Assert
      await expect(
        messageService.getMessagesForUser(1, "invalide")
      ).rejects.toThrow("Type invalide (recus|envoyes)");
    });
  });

  describe("markMessageAsRead", () => {
    it("devrait marquer un message comme lu", async () => {
      // Arrange
      const messageId = 1;
      const userId = 2;

      const mockMessage = {
        id: messageId,
        destinataireId: userId,
        lu: false,
      };

      const mockUpdatedMessage = {
        ...mockMessage,
        lu: true,
      };

      prismaInstance.message.findUnique.mockResolvedValue(mockMessage);
      prismaInstance.message.update.mockResolvedValue(mockUpdatedMessage);

      // Act
      const result = await messageService.markMessageAsRead(messageId, userId);

      // Assert
      expect(prismaInstance.message.findUnique).toHaveBeenCalledWith({
        where: { id: messageId },
      });
      expect(prismaInstance.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: { lu: true },
      });
      expect(result.lu).toBe(true);
    });

    it("devrait rejeter si message introuvable", async () => {
      // Arrange
      prismaInstance.message.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(messageService.markMessageAsRead(1, 2)).rejects.toThrow(
        "Message introuvable"
      );
    });

    it("devrait rejeter si utilisateur non destinataire", async () => {
      // Arrange
      const mockMessage = {
        id: 1,
        destinataireId: 999, // Autre utilisateur
      };

      prismaInstance.message.findUnique.mockResolvedValue(mockMessage);

      // Act & Assert
      await expect(messageService.markMessageAsRead(1, 2)).rejects.toThrow(
        "Accès interdit : vous n'êtes pas le destinataire"
      );
    });

    it("devrait rejeter si paramètres manquants", async () => {
      // Act & Assert
      await expect(messageService.markMessageAsRead(null, 2)).rejects.toThrow(
        "messageId et userId sont requis"
      );

      await expect(messageService.markMessageAsRead(1, null)).rejects.toThrow(
        "messageId et userId sont requis"
      );
    });
  });

  describe("createMessage", () => {
    it("devrait créer un message avec tous les champs", async () => {
      // Arrange
      const messageData = {
        expediteurId: 1,
        destinataireId: 2,
        contenu: "Bonjour !",
        object: "Test",
        reservationId: 10,
        bateauId: 20,
      };

      const mockMessage = {
        id: 1,
        ...messageData,
        dateEnvoi: new Date(),
      };

      prismaInstance.message.create.mockResolvedValue(mockMessage);

      // Act
      const result = await messageService.createMessage(messageData);

      // Assert
      expect(prismaInstance.message.create).toHaveBeenCalledWith({
        data: {
          expediteurId: 1,
          destinataireId: 2,
          contenu: "Bonjour !",
          object: "Test",
          reservationId: 10,
          bateauId: 20,
          dateEnvoi: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it("devrait créer un message avec champs optionnels manquants", async () => {
      // Arrange
      const messageData = {
        expediteurId: 1,
        contenu: "Message simple",
      };

      const mockMessage = {
        id: 1,
        ...messageData,
        destinataireId: null,
        object: null,
        reservationId: null,
        bateauId: null,
        dateEnvoi: new Date(),
      };

      prismaInstance.message.create.mockResolvedValue(mockMessage);

      // Act
      const result = await messageService.createMessage(messageData);

      // Assert
      expect(prismaInstance.message.create).toHaveBeenCalledWith({
        data: {
          expediteurId: 1,
          destinataireId: null,
          contenu: "Message simple",
          object: null,
          reservationId: null,
          bateauId: null,
          dateEnvoi: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it("devrait rejeter si expediteurId manquant", async () => {
      // Act & Assert
      await expect(
        messageService.createMessage({ contenu: "Test" })
      ).rejects.toThrow("expediteurId et contenu sont requis");
    });

    it("devrait rejeter si contenu manquant", async () => {
      // Act & Assert
      await expect(
        messageService.createMessage({ expediteurId: 1 })
      ).rejects.toThrow("expediteurId et contenu sont requis");
    });
  });
});