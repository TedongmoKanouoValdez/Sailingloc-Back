// tests/unitaires/controllers/reservationController.test.js

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

const { PrismaClient } = require("@prisma/client");
const reservationController = require("../../../controllers/reservationController");
const reservationService = require("../../../services/reservationService");

jest.mock("../../../services/reservationService");

describe("Reservation Controller", () => {
  let req, res;
  let prismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    prismaInstance = new PrismaClient();
  });

  // ... Tests existants pour createReservationController ...

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
          contrat: null,
          paiement: null,
        },
      ];

      prismaInstance.reservation.findMany.mockResolvedValue(mockReservations);

      // Act
      await reservationController.getReservationsByProprietaire(req, res);

      // Assert - Mise à jour pour les nouveaux includes
      expect(prismaInstance.reservation.findMany).toHaveBeenCalledWith({
        where: {
          bateau: {
            proprietaireId: 1,
          },
        },
        include: {
          bateau: { include: { medias: true } },
          utilisateur: true,
          contrat: { include: { medias: true } },
          paiement: { include: { recu: { include: { media: true } } } },
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

      // Assert - Mise à jour pour la nouvelle structure de réponse
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        reservations: [] 
      });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      // Arrange
      const proprietaireId = "1";
      req.params = { proprietaireId };

      const dbError = new Error("Erreur DB");
      prismaInstance.reservation.findMany.mockRejectedValue(dbError);

      console.error = jest.fn();

      // Act
      await reservationController.getReservationsByProprietaire(req, res);

      // Assert - Mise à jour pour le nouveau message d'erreur console
      expect(console.error).toHaveBeenCalledWith("❌ Erreur :", dbError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur lors de la récupération des réservations du propriétaire",
        message: "Erreur DB",
      });
    });
  });
});