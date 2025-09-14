const utilisateurService = require("../../../services/utilisateurService");

// Mock des dépendances avec les bons chemins
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    utilisateur: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    proprietaire: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    bateau: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    detailsBateau: {
      deleteMany: jest.fn(),
    },
    media: {
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    RoleUtilisateur: { CLIENT: "CLIENT", PROPRIETAIRE: "PROPRIETAIRE" },
    TypeMedia: { PROFIL: "PROFIL" },
  };
});

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword123"),
  genSalt: jest.fn().mockResolvedValue("salt123"),
}));

jest.mock("../../../utils/cloudinaryConfig", () => ({
  cloudinary: {
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: "https://cloudinary.com/photo.jpg",
      }),
      destroy: jest.fn().mockResolvedValue({}),
    },
  },
  getPublicIdFromUrl: jest.fn().mockReturnValue("mock-public-id"),
}));

jest.mock("../../../validation/utilisateurValidation", () => ({
  validateUtilisateurInput: jest.fn(),
}));

jest.mock("fs-extra", () => ({
  remove: jest.fn().mockResolvedValue(true),
  unlinkSync: jest.fn(),
}));

// Mock console pour éviter les sorties pendant les tests
console.log = jest.fn();
console.error = jest.fn();

describe("Utilisateur Service", () => {
  let prismaInstance;
  let validationModule;
  let cloudinaryModule;
  let bcryptModule;
  let fsModule;
  let mockData;
  let mockFile;

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer les instances mockées
    const { PrismaClient } = require("@prisma/client");
    prismaInstance = new PrismaClient();
    validationModule = require("../../../validation/utilisateurValidation");
    cloudinaryModule = require("../../../utils/cloudinaryConfig");
    bcryptModule = require("bcrypt");
    fsModule = require("fs-extra");

    // Initialiser les données mock
    mockData = {
      nom: "Doe",
      prenom: "John",
      email: "john@example.com",
      motDePasse: "password123",
      role: "CLIENT",
    };

    mockFile = { path: "/tmp/photo.jpg" };
  });

  describe("createUserWithPhoto", () => {
    it("devrait créer un utilisateur avec photo valide", async () => {
      // Mock de la validation
      validationModule.validateUtilisateurInput.mockReturnValue(null);

      // Mock de Prisma
      prismaInstance.utilisateur.create.mockResolvedValue({
        id: 1,
        nom: "Doe",
        prenom: "John",
        email: "john@example.com",
        role: "CLIENT",
        photoProfil: "https://cloudinary.com/photo.jpg",
      });

      // Act
      const result = await utilisateurService.createUserWithPhoto(
        mockData,
        mockFile
      );

      // Assert
      expect(validationModule.validateUtilisateurInput).toHaveBeenCalledWith(
        mockData
      );
      expect(result).toHaveProperty("id");
      expect(result).not.toHaveProperty("motDePasse");
      expect(fsModule.remove).toHaveBeenCalledWith(mockFile.path);
    });

    it("devrait créer un utilisateur propriétaire", async () => {
      // Arrange
      const proprietaireData = { ...mockData, role: "PROPRIETAIRE" };
      validationModule.validateUtilisateurInput.mockReturnValue(null);

      prismaInstance.utilisateur.create.mockResolvedValue({
        id: 2,
        ...proprietaireData,
        photoProfil: "https://cloudinary.com/photo.jpg",
      });

      // Act
      await utilisateurService.createUserWithPhoto(proprietaireData, mockFile);

      // Assert
      expect(prismaInstance.proprietaire.create).toHaveBeenCalled();
    });

    it("devrait échouer si la validation échoue", async () => {
      // Mock de la validation qui échoue
      validationModule.validateUtilisateurInput.mockReturnValue(
        "Email invalide"
      );

      // Act & Assert
      await expect(
        utilisateurService.createUserWithPhoto(mockData, mockFile)
      ).rejects.toThrow("Email invalide");
      expect(fsModule.remove).toHaveBeenCalledWith(mockFile.path);
    });

    it("devrait gérer les erreurs lors de la création", async () => {
      validationModule.validateUtilisateurInput.mockReturnValue(null);
      prismaInstance.utilisateur.create.mockRejectedValue(
        new Error("DB Error")
      );

      await expect(
        utilisateurService.createUserWithPhoto(mockData, mockFile)
      ).rejects.toThrow("DB Error");
      expect(fsModule.remove).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe("updateUserWithPhoto", () => {
    it("devrait mettre à jour un utilisateur sans photo", async () => {
      // Mock de Prisma
      prismaInstance.utilisateur.findUnique.mockResolvedValue({
        id: 1,
        photoProfil: null,
      });

      prismaInstance.utilisateur.update.mockResolvedValue({
        id: 1,
        nom: "Doe",
        prenom: "Jane",
        email: "jane@example.com",
      });

      // Act
      const result = await utilisateurService.updateUserWithPhoto(
        1,
        mockData,
        null
      );

      // Assert
      expect(prismaInstance.utilisateur.update).toHaveBeenCalled();
      expect(result.nom).toBe("Doe");
    });

    it("devrait mettre à jour avec une nouvelle photo", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue({
        id: 1,
        photoProfil: "https://old-photo.jpg",
      });

      prismaInstance.utilisateur.update.mockResolvedValue({
        id: 1,
        ...mockData,
        photoProfil: "https://new-photo.jpg",
      });

      const result = await utilisateurService.updateUserWithPhoto(
        1,
        mockData,
        mockFile
      );

      expect(cloudinaryModule.cloudinary.uploader.destroy).toHaveBeenCalled();
      expect(cloudinaryModule.cloudinary.uploader.upload).toHaveBeenCalled();
      expect(fsModule.unlinkSync).toHaveBeenCalledWith(mockFile.path);
    });

    it("devrait hash le mot de passe si fourni", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue({
        id: 1,
        photoProfil: null,
      });

      prismaInstance.utilisateur.update.mockResolvedValue({
        id: 1,
        ...mockData,
        motDePasse: "hashedPassword123",
      });

      await utilisateurService.updateUserWithPhoto(1, mockData, null);

      expect(bcryptModule.hash).toHaveBeenCalled();
    });

    it("devrait gérer les erreurs lors de la mise à jour", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue({
        id: 1,
        photoProfil: null,
      });
      prismaInstance.utilisateur.update.mockRejectedValue(
        new Error("Erreur mise à jour")
      );

      await expect(
        utilisateurService.updateUserWithPhoto(1, mockData, null)
      ).rejects.toThrow("Erreur mise à jour");
    });
  });

  describe("deleteUserById", () => {
    it("devrait supprimer un utilisateur client sans bateaux", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue({
        id: 1,
        role: "CLIENT",
        photoProfil: "https://cloudinary.com/photo.jpg",
      });

      prismaInstance.proprietaire.findUnique.mockResolvedValue(null);
      prismaInstance.utilisateur.delete.mockResolvedValue({});

      await utilisateurService.deleteUserById(1);

      expect(cloudinaryModule.cloudinary.uploader.destroy).toHaveBeenCalled();
      expect(prismaInstance.utilisateur.delete).toHaveBeenCalled();
    });

    it("devrait supprimer un propriétaire avec bateaux", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue({
        id: 1,
        role: "PROPRIETAIRE",
        photoProfil: "https://photo.jpg",
      });

      prismaInstance.proprietaire.findUnique.mockResolvedValue({
        id: 1,
      });

      prismaInstance.bateau.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      prismaInstance.detailsBateau.deleteMany.mockResolvedValue({});
      prismaInstance.bateau.deleteMany.mockResolvedValue({});
      prismaInstance.proprietaire.delete.mockResolvedValue({});
      prismaInstance.utilisateur.delete.mockResolvedValue({});

      await utilisateurService.deleteUserById(1);

      expect(prismaInstance.detailsBateau.deleteMany).toHaveBeenCalled();
      expect(prismaInstance.bateau.deleteMany).toHaveBeenCalled();
      expect(prismaInstance.proprietaire.delete).toHaveBeenCalled();
    });

    it("devrait gérer les erreurs de suppression", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue({
        id: 1,
        role: "CLIENT",
        photoProfil: "https://photo.jpg",
      });
      prismaInstance.proprietaire.findUnique.mockResolvedValue(null);
      prismaInstance.utilisateur.delete.mockRejectedValue(
        new Error("Erreur suppression")
      );

      await expect(utilisateurService.deleteUserById(1)).rejects.toThrow(
        "Erreur suppression"
      );
    });

    it("devrait throw une erreur si utilisateur non trouvé", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue(null);

      await expect(utilisateurService.deleteUserById(999)).rejects.toThrow(
        "Utilisateur non trouvé"
      );
    });
  });

  describe("getAllUtilisateur", () => {
    it("devrait gérer les erreurs de récupération", async () => {
      prismaInstance.utilisateur.findMany.mockRejectedValue(
        new Error("DB Error")
      );

      await expect(utilisateurService.getAllUtilisateur()).rejects.toThrow(
        "DB Error"
      );
    });
  });

  describe("getUtilisateurById", () => {
    it("devrait retourner un utilisateur par ID", async () => {
      const mockUser = {
        id: 1,
        nom: "Doe",
        prenom: "John",
        email: "john@example.com",
      };

      prismaInstance.utilisateur.findUnique.mockResolvedValue(mockUser);

      const result = await utilisateurService.getUtilisateurById(1);

      expect(result).toEqual(mockUser);
      expect(prismaInstance.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si utilisateur non trouvé", async () => {
      prismaInstance.utilisateur.findUnique.mockResolvedValue(null);

      const result = await utilisateurService.getUtilisateurById(999);

      expect(result).toBeNull();
    });
  });

  // Tests supplémentaires pour couverture 100%
  it("devrait gérer les erreurs cloudinary lors de la création", async () => {
    validationModule.validateUtilisateurInput.mockReturnValue(null);
    cloudinaryModule.cloudinary.uploader.upload.mockRejectedValue(
      new Error("Cloudinary error")
    );

    await expect(
      utilisateurService.createUserWithPhoto(mockData, mockFile)
    ).rejects.toThrow("Cloudinary error");
  });

  it("devrait gérer les erreurs cloudinary lors de la mise à jour", async () => {
    prismaInstance.utilisateur.findUnique.mockResolvedValue({
      id: 1,
      photoProfil: "https://old-photo.jpg",
    });
    cloudinaryModule.cloudinary.uploader.upload.mockRejectedValue(
      new Error("Upload error")
    );

    await expect(
      utilisateurService.updateUserWithPhoto(1, mockData, mockFile)
    ).rejects.toThrow("Impossible d'uploader la nouvelle photo");
  });
});
