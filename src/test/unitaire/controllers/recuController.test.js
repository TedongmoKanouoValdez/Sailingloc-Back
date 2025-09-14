const recuController = require("../../../controllers/recuController");
const recuService = require("../../../services/recuService");

// Mock du service
jest.mock("../../../services/recuService");

describe("Recu Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup des objets req et res
    req = {
      body: {},
      file: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  describe("uploadRecuController", () => {
    it("devrait retourner 400 si reservationId manquant", async () => {
      // Arrange
      req.body = {}; // Pas de reservationId
      req.file = { path: "/tmp/recu.pdf" };

      // Act
      await recuController.uploadRecuController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Reservation ID manquant",
      });
      expect(recuService.uploadRecuService).not.toHaveBeenCalled();
    });

    it("devrait retourner 400 si fichier manquant", async () => {
      // Arrange
      req.body = { reservationId: "1" };
      req.file = null; // Pas de fichier

      // Act
      await recuController.uploadRecuController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Fichier manquant" });
      expect(recuService.uploadRecuService).not.toHaveBeenCalled();
    });

    it("devrait gérer les erreurs du service", async () => {
      // Arrange
      req.body = { reservationId: "1" };
      req.file = { path: "/tmp/recu.pdf" };

      const error = new Error("Paiement non trouvé");
      recuService.uploadRecuService.mockRejectedValue(error);

      // Mock console.error
      console.error = jest.fn();

      // Act
      await recuController.uploadRecuController(req, res);

      // Assert
      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Paiement non trouvé" });
    });

    it("devrait gérer les erreurs de validation du service", async () => {
      // Arrange
      req.body = { reservationId: "1" };
      req.file = { path: "/tmp/recu.pdf" };

      const error = new Error("Un reçu existe déjà pour ce paiement");
      recuService.uploadRecuService.mockRejectedValue(error);

      // Mock console.error
      console.error = jest.fn();

      // Act
      await recuController.uploadRecuController(req, res);

      // Assert
      expect(console.error).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Un reçu existe déjà pour ce paiement",
      });
    });
  });
});
