// messageController.test.js
const messageController = require("../../../controllers/messageController");

// Mock simple pour éviter les erreurs d'import
jest.mock("../../../utils/prismaClient", () => {
  return {
    message: {
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    }
  };
});

const prisma = require("../../../utils/prismaClient");

describe("Message Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: {},
      params: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  describe("getMessagesController", () => {
    it("devrait retourner 400 si userId manquant", async () => {
      // Arrange
      req.query = { type: "recus" };

      // Act
      await messageController.getMessagesController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "userId est requis dans la query",
      });
    });

    it("devrait gérer les erreurs de la base de données", async () => {
      // Arrange
      req.query = { userId: "1" };
      const error = new Error("Erreur base de données");
      prisma.message.findMany.mockRejectedValue(error);

      // Mock console.error
      console.error = jest.fn();

      // Act
      await messageController.getMessagesController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });

  describe("markAsReadController", () => {
    it("devrait marquer un message comme lu avec succès", async () => {
      // Arrange
      req.params = { id: "123" };
      req.query = { userId: "1" };

      const mockMessage = { id: 123, destinataireId: 1 };
      const mockUpdatedMessage = { id: 123, lu: true };

      prisma.message.findUnique.mockResolvedValue(mockMessage);
      prisma.message.update.mockResolvedValue(mockUpdatedMessage);

      // Act
      await messageController.markAsReadController(req, res);

      // Assert
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 123 },
        data: { lu: true },
      });
      expect(res.json).toHaveBeenCalledWith(mockUpdatedMessage);
    });

    it("devrait retourner 403 pour accès interdit", async () => {
      // Arrange
      req.params = { id: "123" };
      req.query = { userId: "2" };

      const mockMessage = { id: 123, destinataireId: 1 }; // destinataireId différent de userId

      prisma.message.findUnique.mockResolvedValue(mockMessage);

      // Act
      await messageController.markAsReadController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Accès interdit : vous n'êtes pas le destinataire",
      });
    });

    it("devrait gérer les erreurs de message introuvable", async () => {
      // Arrange
      req.params = { id: "123" };
      req.query = { userId: "1" };

      prisma.message.findUnique.mockResolvedValue(null);

      // Act
      await messageController.markAsReadController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Message introuvable",
      });
    });
  });

  // Suppression des tests pour les fonctions qui n'existent pas
  // describe("createMessageController") et autres tests inutiles supprimés
});