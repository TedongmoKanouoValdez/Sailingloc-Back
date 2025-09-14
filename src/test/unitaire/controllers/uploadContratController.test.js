// Tests pour uploadContrat controller
const { PrismaClient } = require('@prisma/client');
const { cloudinary } = require('../../../utils/cloudinaryConfig');
const fs = require('fs');

// Mock des dépendances AVANT l'import du controller
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    contrat: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    media: {
      create: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

jest.mock('../../../utils/cloudinaryConfig');
jest.mock('fs');

// Maintenant importer le controller APRÈS les mocks
const { uploadContrat } = require('../../../controllers/contratController');

describe('uploadContrat Controller', () => {
  let req, res;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Récupérer l'instance mockée de Prisma
    mockPrisma = new PrismaClient();

    // Configuration des objets req et res
    req = {
      body: {},
      file: {
        path: '/tmp/contrat.pdf'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock console.error pour éviter le bruit dans les tests
    console.error = jest.fn();
  });

  it('devrait retourner une erreur 400 si reservationId est manquant', async () => {
    // Arrange
    req.body = {};

    // Act
    await uploadContrat(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Reservation ID manquant' });
    expect(mockPrisma.contrat.findUnique).not.toHaveBeenCalled();
  });

  it('devrait gérer les erreurs lors de l\'upload Cloudinary', async () => {
    // Arrange
    req.body = { reservationId: '123' };
    
    const mockContrat = { id: 1, reservationId: 123, signature: true };
    
    mockPrisma.contrat.findUnique.mockResolvedValue(mockContrat);
    cloudinary.uploader.upload.mockRejectedValue(new Error('Cloudinary upload failed'));

    // Act
    await uploadContrat(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
    expect(console.error).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs lors de la création du contrat', async () => {
    // Arrange
    req.body = { reservationId: '123' };
    
    mockPrisma.contrat.findUnique.mockResolvedValue(null);
    mockPrisma.contrat.create.mockRejectedValue(new Error('Database error'));

    // Act
    await uploadContrat(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
    expect(console.error).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs lors de la création du media', async () => {
    // Arrange
    req.body = { reservationId: '123' };
    
    const mockContrat = { id: 1, reservationId: 123, signature: true };
    const cloudinaryResult = { secure_url: 'https://cloudinary.com/contrat.pdf' };
    
    mockPrisma.contrat.findUnique.mockResolvedValue(mockContrat);
    cloudinary.uploader.upload.mockResolvedValue(cloudinaryResult);
    mockPrisma.media.create.mockRejectedValue(new Error('Media creation failed'));

    // Act
    await uploadContrat(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
    expect(console.error).toHaveBeenCalled();
  });

  it('devrait retourner une erreur 500 si la suppression du fichier échoue', async () => {
  // Arrange
  req.body = { reservationId: '123' };
  
  const mockContrat = { id: 1, reservationId: 123, signature: true };
  const cloudinaryResult = { secure_url: 'https://cloudinary.com/contrat.pdf' };
  
  mockPrisma.contrat.findUnique.mockResolvedValue(mockContrat);
  cloudinary.uploader.upload.mockResolvedValue(cloudinaryResult);
  mockPrisma.media.create.mockResolvedValue({});
  
  fs.unlinkSync.mockImplementation(() => {
    throw new Error('File deletion failed');
  });

  // Act
  await uploadContrat(req, res);

  // Assert
  // Le comportement actuel est de retourner une erreur 500
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
  expect(console.error).toHaveBeenCalled();
});

  it('devrait convertir reservationId string en number', async () => {
    // Arrange
    req.body = { reservationId: '456' };
    
    const mockContrat = { id: 2, reservationId: 456, signature: true };
    const cloudinaryResult = { secure_url: 'https://cloudinary.com/contrat2.pdf' };
    
    mockPrisma.contrat.findUnique.mockResolvedValue(mockContrat);
    cloudinary.uploader.upload.mockResolvedValue(cloudinaryResult);
    mockPrisma.media.create.mockResolvedValue({});

    // Act
    await uploadContrat(req, res);

    // Assert
    expect(mockPrisma.contrat.findUnique).toHaveBeenCalledWith({
      where: { reservationId: 456 } // Doit être un number, pas une string
    });
  });
});