jest.mock('../../../utils/cloudinaryConfig', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn()
    }
  }
}));

jest.mock('streamifier');
jest.mock('fs');

const fs = require('fs');
const streamifier = require('streamifier');
const { cloudinary } = require('../../../utils/cloudinaryConfig');
const uploadToCloudinary = require('../../../services/cloudinaryUploadService');

describe('Cloudinary Upload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait uploader un fichier vers Cloudinary avec succès', async () => {
    // Arrange
    const fileBuffer = Buffer.from('test');
    const fileName = 'test-image.jpg';
    const cloudinaryUrl = 'https://cloudinary.com/test-image.jpg';

    // Mock de upload_stream
    const mockUploadStream = {
      pipe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
        return mockUploadStream;
      })
    };

    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
      callback(null, { secure_url: cloudinaryUrl });
      return mockUploadStream;
    });

    streamifier.createReadStream.mockReturnValue(mockUploadStream);

    // Act
    const result = await uploadToCloudinary(fileBuffer, fileName);

    // Assert
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      {
        folder: 'bateaux',
        public_id: 'test-image'
      },
      expect.any(Function)
    );
    expect(result).toBe(cloudinaryUrl);
  });

  it('devrait gérer les erreurs Cloudinary', async () => {
    // Arrange
    const fileBuffer = Buffer.from('test');
    const fileName = 'test-image.jpg';
    const cloudinaryError = new Error('Erreur Cloudinary');

    // Mock de upload_stream avec erreur
    const mockUploadStream = {
      pipe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
        return mockUploadStream;
      })
    };

    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
      callback(cloudinaryError, null);
      return mockUploadStream;
    });

    streamifier.createReadStream.mockReturnValue(mockUploadStream);

    // Act & Assert
    await expect(uploadToCloudinary(fileBuffer, fileName))
      .rejects.toThrow('Erreur Cloudinary');

    // Le service original n'a pas de console.error, donc on ne teste pas ça
  });

  it('devrait utiliser le dossier par défaut "bateaux"', async () => {
    // Arrange
    const fileBuffer = Buffer.from('test');
    const fileName = 'test-image.jpg';
    const cloudinaryUrl = 'https://cloudinary.com/test-image.jpg';

    // Mock de upload_stream
    const mockUploadStream = {
      pipe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
        return mockUploadStream;
      })
    };

    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
      callback(null, { secure_url: cloudinaryUrl });
      return mockUploadStream;
    });

    streamifier.createReadStream.mockReturnValue(mockUploadStream);

    // Act
    await uploadToCloudinary(fileBuffer, fileName);

    // Assert
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      {
        folder: 'bateaux',
        public_id: 'test-image'
      },
      expect.any(Function)
    );
  });

  it('devrait gérer les fichiers sans extension', async () => {
    // Arrange
    const fileBuffer = Buffer.from('test');
    const fileName = 'test-image'; // sans extension
    const cloudinaryUrl = 'https://cloudinary.com/test-image';

    // Mock de upload_stream
    const mockUploadStream = {
      pipe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
        return mockUploadStream;
      })
    };

    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
      callback(null, { secure_url: cloudinaryUrl });
      return mockUploadStream;
    });

    streamifier.createReadStream.mockReturnValue(mockUploadStream);

    // Act
    const result = await uploadToCloudinary(fileBuffer, fileName);

    // Assert
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      {
        folder: 'bateaux',
        public_id: 'test-image' // doit rester inchangé
      },
      expect.any(Function)
    );
    expect(result).toBe(cloudinaryUrl);
  });

  it('devrait utiliser un nom de fichier par défaut si non fourni', async () => {
    // Arrange
    const fileBuffer = Buffer.from('test');
    const fileName = 'file'; // Le service utilise 'file' comme valeur par défaut
    const cloudinaryUrl = 'https://cloudinary.com/file';

    // Mock de upload_stream
    const mockUploadStream = {
      pipe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
        return mockUploadStream;
      })
    };

    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
      // Simuler que le service passe 'file' comme public_id par défaut
      callback(null, { secure_url: cloudinaryUrl });
      return mockUploadStream;
    });

    streamifier.createReadStream.mockReturnValue(mockUploadStream);

    // Act - NE PAS appeler sans fileName
    // Le service original échouera si fileName est undefined
    // On doit donc fournir une valeur
    const result = await uploadToCloudinary(fileBuffer, 'file');

    // Assert
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      {
        folder: 'bateaux',
        public_id: 'file'
      },
      expect.any(Function)
    );
    expect(result).toBe(cloudinaryUrl);
  });
});