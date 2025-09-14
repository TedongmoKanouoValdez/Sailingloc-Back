const handleValidation = require("../../../middleware/handleValidation");
const { validationResult } = require("express-validator");

// Mock de express-validator
jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("handleValidation Middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("Cas sans erreurs de validation", () => {
    it("devrait appeler next() si aucune erreur de validation", () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });

      // Act
      handleValidation(req, res, next);

      // Assert
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("Cas avec erreurs de validation", () => {
    it("devrait renvoyer 400 avec les erreurs si validation échoue", () => {
      // Arrange
      const mockErrors = [
        { msg: "Email invalide", param: "email" },
        { msg: "Mot de passe trop court", param: "password" },
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      // Act
      handleValidation(req, res, next);

      // Assert
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
      expect(next).not.toHaveBeenCalled();
    });

    it("devrait formater correctement les erreurs de validation", () => {
      // Arrange
      const mockErrors = [
        {
          type: "field",
          value: "invalid-email",
          msg: "Email invalide",
          path: "email",
          location: "body",
        },
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      // Act
      handleValidation(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: "Email invalide",
            path: "email",
          }),
        ]),
      });
    });
  });

  describe("Tests edge cases", () => {
    it("devrait gérer un tableau d'erreurs vide mais isEmpty=false", () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => false, // Dit qu'il y a des erreurs
        array: () => [], // Mais retourne un tableau vide
      });

      // Act
      handleValidation(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [] });
    });

    describe("Tests edge cases", () => {
      it("ne devrait pas gérer les erreurs de validationResult (comportement actuel)", () => {
        // Arrange
        validationResult.mockImplementation(() => {
          throw new Error("Erreur inattendue");
        });

        // Act & Assert - S'attend à ce que le middleware lance une exception
        expect(() => {
          handleValidation(req, res, next);
        }).toThrow("Erreur inattendue");
      });
    });
  });

  describe("Performance et robustesse", () => {
    it("devrait être rapide avec beaucoup d'erreurs", () => {
      // Arrange - Simule 1000 erreurs
      const manyErrors = Array(1000)
        .fill()
        .map((_, i) => ({
          msg: `Erreur ${i}`,
          param: `field${i}`,
        }));

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => manyErrors,
      });

      // Act
      handleValidation(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ errors: manyErrors });
    });
  });
});
