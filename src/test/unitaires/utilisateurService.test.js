const { createUserWithPhoto } = require("../../services/utilisateurService");
const fs = require("fs-extra");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary");
const prisma = require("../../prisma");

jest.mock("fs-extra");
jest.mock("cloudinary", () => ({
  uploader: { upload: jest.fn() },
}));
jest.mock("../../../prisma", () => ({
  utilisateur: { create: jest.fn() },
  proprietaire: { create: jest.fn() },
}));

describe("utilisateurService", () => {
  test("devrait créer un utilisateur avec des données valides", async () => {
    const data = {
      nom: "Doe",
      prenom: "John",
      email: "john.doe@example.com",
      motDePasse: "Password123!",
      role: "UTILISATEUR",
    };

    const file = { path: "fakepath.jpg" };

    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "http://fakeurl.com/photo.jpg",
    });

    prisma.utilisateur.create.mockResolvedValue({
      id: 1,
      ...data,
      motDePasse: "hashedPassword",
      photoProfil: "http://fakeurl.com/photo.jpg",
    });

    fs.remove.mockResolvedValue();

    const result = await createUserWithPhoto(data, file);

    expect(result).toEqual({
      id: 1,
      nom: "Doe",
      prenom: "John",
      email: "john.doe@example.com",
      role: "UTILISATEUR",
      photoProfil: "http://fakeurl.com/photo.jpg",
    });

    expect(fs.remove).toHaveBeenCalledWith("fakepath.jpg");
  });
});
