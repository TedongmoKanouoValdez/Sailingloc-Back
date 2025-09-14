// tests/unitaires/controllers/reservationController.test.js

// Mock GLOBAL de Prisma AVANT l'import du controller
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    reservation: {
      findMany: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Maintenant importer les modules
const { PrismaClient } = require("@prisma/client");
const reservationController = require("../../../controllers/reservationController");
const reservationService = require("../../../services/reservationService");

// Mock du service
jest.mock("../../../services/reservationService");

describe("Reservation Controller", () => {
  let req, res;
  let prismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup des objets req et res
    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    // Récupérer l'instance mockée de Prisma
    prismaInstance = new PrismaClient();
  });

  describe("createReservationController", () => {
    it("devrait créer une réservation avec succès", async () => {
      // Arrange
      const reservationData = {
        utilisateurId: 1,
        bateauId: 1,
        dateDebut: "2024-01-01",
        dateFin: "2024-01-05",
      };

      req.body = reservationData;

      const mockReservation = { id: 1, ...reservationData };
      reservationService.createReservation.mockResolvedValue(mockReservation);

      // Act
      await reservationController.createReservationController(req, res);

      // Assert
      expect(reservationService.createReservation).toHaveBeenCalledWith(
        reservationData
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Réservation créée",
        reservation: mockReservation,
      });
    });

    it("devrait gérer les erreurs personnalisées du service", async () => {
      // Arrange
      req.body = { utilisateurId: 1, bateauId: 1 };

      const customError = new Error("Réservation déjà existante");
      customError.statusCode = 400;
      reservationService.createReservation.mockRejectedValue(customError);

      // Mock console.error
      console.error = jest.fn();

      // Act
      await reservationController.createReservationController(req, res);

      // Assert
      expect(console.error).toHaveBeenCalledWith(customError);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Réservation déjà existante",
      });
    });

    it("devrait gérer les erreurs génériques du service", async () => {
      // Arrange
      req.body = { utilisateurId: 1, bateauId: 1 };

      const genericError = new Error("Erreur base de données");
      reservationService.createReservation.mockRejectedValue(genericError);

      // Mock console.error
      console.error = jest.fn();

      // Act
      await reservationController.createReservationController(req, res);

      // Assert - Le controller retourne le message d'erreur original
      expect(console.error).toHaveBeenCalledWith(genericError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur base de données", // ← Message original, pas le message générique
      });
    });
  });

  describe("getReservationsByProprietaire", () => {
    it("devrait récupérer les réservations d'un propriétaire avec succès", async () => {
      // Arrange
      const proprietaireId = "1";
      req.params = { proprietaireId };

      const mockReservations = [
        {
          id: 1,
          bateau: { id: 1, nom: "Bateau Test", medias: [] },
          utilisateur: { id: 2, nom: "User Test" },
        },
      ];

      prismaInstance.reservation.findMany.mockResolvedValue(mockReservations);

      // Act
      await reservationController.getReservationsByProprietaire(req, res);

      // Assert
      expect(prismaInstance.reservation.findMany).toHaveBeenCalledWith({
        where: {
          bateau: {
            proprietaireId: 1,
          },
        },
        include: {
          bateau: { include: { medias: true } },
          utilisateur: true,
        },
        orderBy: { creeLe: "desc" },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        reservations: mockReservations,
      });
    });

    it("devrait retourner un tableau vide si aucune réservation", async () => {
      // Arrange
      const proprietaireId = "1";
      req.params = { proprietaireId };

      prismaInstance.reservation.findMany.mockResolvedValue([]);

      // Act
      await reservationController.getReservationsByProprietaire(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ reservations: [] });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      // Arrange
      const proprietaireId = "1";
      req.params = { proprietaireId };

      const dbError = new Error("Erreur DB");
      prismaInstance.reservation.findMany.mockRejectedValue(dbError);

      // Mock console.error
      console.error = jest.fn();

      // Act
      await reservationController.getReservationsByProprietaire(req, res);

      // Assert
      expect(console.error).toHaveBeenCalledWith("Erreur :", dbError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Erreur lors de la récupération des réservations du propriétaire",
        message: "Erreur DB",
      });
    });
  });
});
