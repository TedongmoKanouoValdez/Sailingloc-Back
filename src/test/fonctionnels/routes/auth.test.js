const request = require('supertest');
const app = require('../../../app');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock bcrypt et jwt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Mock manuel de @prisma/client
jest.mock('@prisma/client', () => {
  // Mock des méthodes Prisma
  const mockUtilisateur = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  };

  const mockRefreshToken = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  };

  const mockPrisma = {
    utilisateur: mockUtilisateur,
    refreshToken: mockRefreshToken,
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn()
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    RoleUtilisateur: {
      CLIENT: 'CLIENT',
      ADMIN: 'ADMIN'
    }
  };
});

// Import APRÈS les mocks
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Tests d\'authentification avec Mocks', () => {
  const mockUser = {
    id: 1,
    nom: 'Doe',
    prenom: 'Jane',
    email: 'jane.doe@test.com',
    motDePasse: '$2b$10$hashedpassword',
    role: 'CLIENT',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurations de base des mocks
    bcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock-jwt-token');
    jwt.verify.mockReturnValue({ userId: 1, email: mockUser.email });
  });

  it('POST /api/auth/register → devrait créer un utilisateur', async () => {
    // Mock : aucun utilisateur existant
    prisma.utilisateur.findUnique.mockResolvedValue(null);
    // Mock : création réussie
    prisma.utilisateur.create.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nom: 'Doe',
        prenom: 'Jane',
        email: 'jane.doe@test.com',
        password: 'Password123!',
        role: 'CLIENT'
      });

    expect(res.statusCode).toBe(201);
    expect(prisma.utilisateur.create).toHaveBeenCalled();
    expect(res.body.user.email).toBe('jane.doe@test.com');
  });

  it('POST /api/auth/register → devrait refuser un email existant', async () => {
    // Mock : utilisateur déjà existant
    prisma.utilisateur.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nom: 'Doe',
        prenom: 'John',
        email: 'jane.doe@test.com', // Email déjà existant
        password: 'Password123!',
        role: 'CLIENT'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Email déjà utilisé');
  });

  it('POST /api/auth/login → devrait renvoyer un token', async () => {
    // Mock : utilisateur trouvé
    prisma.utilisateur.findUnique.mockResolvedValue(mockUser);
    // Mock : refresh token créé
    prisma.refreshToken.create.mockResolvedValue({
      id: 1,
      token: 'mock-refresh-token',
      userId: mockUser.id,
      expiresAt: new Date()
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane.doe@test.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('POST /api/auth/login → devrait échouer pour mot de passe incorrect', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(mockUser);
    // Mock : mot de passe incorrect
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane.doe@test.com',
        password: 'WrongPassword!'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Mot de passe incorrect');
  });

  it('POST /api/auth/login → devrait échouer pour utilisateur inexistant', async () => {
    // Mock : utilisateur non trouvé
    prisma.utilisateur.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@test.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Utilisateur non trouvé');
  });
});