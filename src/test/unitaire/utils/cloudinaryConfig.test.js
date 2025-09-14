// test/unitaire/utils/cloudinaryConfig.test.js

// Mock de cloudinary
jest.mock("cloudinary", () => {
  const mockV2 = {
    config: jest.fn(),
  };

  return {
    v2: mockV2,
  };
});

// Importer APRÈS le mock
const { getPublicIdFromUrl } = require("../../../utils/cloudinaryConfig");

describe("Cloudinary Config", () => {
  // Test séparé pour la configuration
  it("devrait avoir configuré cloudinary", () => {
    // Importer cloudinary après le mock pour vérifier la configuration
    const cloudinary = require("cloudinary");
    expect(cloudinary.v2.config).toHaveBeenCalledWith({
      cloud_name: "dv19l9qkz",
      api_key: "758661918223334",
      api_secret: "EMixlJsD7o4IOgvESs2pyN2NXYU",
    });
  });

  describe("getPublicIdFromUrl", () => {
    // Tests pour les URLs valides
    it("devrait extraire le publicId correctement d'une URL cloudinary", () => {
      const url =
        "https://res.cloudinary.com/dv19l9qkz/image/upload/v1234567890/utilisateurs/zcfvxf59wgjyfiw4s2b7.png";
      const result = getPublicIdFromUrl(url);
      expect(result).toBe("utilisateurs/zcfvxf59wgjyfiw4s2b7");
    });

    it("devrait gérer les URLs avec plusieurs sous-dossiers", () => {
      const url =
        "https://res.cloudinary.com/dv19l9qkz/image/upload/v1234567890/produits/categories/electroniques/ordinateur-portable.png";
      const result = getPublicIdFromUrl(url);
      expect(result).toBe("electroniques/ordinateur-portable");
    });

    it("devrait gérer les URLs sans extension", () => {
      const url =
        "https://res.cloudinary.com/dv19l9qkz/image/upload/v1234567890/utilisateurs/zcfvxf59wgjyfiw4s2b7";
      const result = getPublicIdFromUrl(url);
      expect(result).toBe("utilisateurs/zcfvxf59wgjyfiw4s2b7");
    });

    it("devrait gérer les URLs avec query parameters", () => {
      const url =
        "https://res.cloudinary.com/dv19l9qkz/image/upload/v1234567890/utilisateurs/zcfvxf59wgjyfiw4s2b7.png?width=200&height=200";
      const result = getPublicIdFromUrl(url);
      expect(result).toBe("utilisateurs/zcfvxf59wgjyfiw4s2b7");
    });

    it("devrait gérer les URLs avec des transformations", () => {
      const url =
        "https://res.cloudinary.com/dv19l9qkz/image/upload/c_fill,h_200,w_200/v1234567890/utilisateurs/zcfvxf59wgjyfiw4s2b7.jpg";
      const result = getPublicIdFromUrl(url);
      expect(result).toBe("utilisateurs/zcfvxf59wgjyfiw4s2b7");
    });

    // Tests pour le comportement actuel avec différentes URLs
    it("devrait retourner example.com/image pour une URL non cloudinary", () => {
      const invalidUrl = "https://example.com/image.png";
      const result = getPublicIdFromUrl(invalidUrl);
      expect(result).toBe("example.com/image");
    });

    it("devrait retourner dv19l9qkz/ pour une URL sans chemin", () => {
      const invalidUrl = "https://res.cloudinary.com/dv19l9qkz/";
      const result = getPublicIdFromUrl(invalidUrl);
      expect(result).toBe("dv19l9qkz/");
    });

    it("devrait retourner upload/ pour une URL avec chemin incomplet", () => {
      const invalidUrl = "https://res.cloudinary.com/dv19l9qkz/image/upload/";
      const result = getPublicIdFromUrl(invalidUrl);
      expect(result).toBe("upload/");
    });

    it("devrait retourner undefined/ pour une URL vide", () => {
      const result = getPublicIdFromUrl("");
      expect(result).toBe("undefined/");
    });

    // Tests pour les cas d'erreur - on s'attend à ce que la fonction crash
    it("devrait crash pour une URL undefined", () => {
      expect(() => {
        getPublicIdFromUrl(undefined);
      }).toThrow();
    });

    it("devrait crash pour une URL null", () => {
      expect(() => {
        getPublicIdFromUrl(null);
      }).toThrow();
    });
  });
});
