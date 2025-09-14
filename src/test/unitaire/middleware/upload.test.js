// upload.test.js
describe('Middleware Upload', () => {
  let multer;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Configurer les mocks COMPLETS pour multer
    jest.mock('multer', () => {
      const mockMemoryStorage = jest.fn(() => ({
        _handleFile: jest.fn(),
        _removeFile: jest.fn()
      }));
      
      const mockInstance = {
        single: jest.fn(() => jest.fn()),
        array: jest.fn(() => jest.fn()),
        fields: jest.fn(() => jest.fn()),
        none: jest.fn(() => jest.fn())
      };
      
      const mockMulter = jest.fn((options) => mockInstance);
      
      // Ajouter les méthodes statiques nécessaires
      mockMulter.diskStorage = jest.fn();
      mockMulter.memoryStorage = mockMemoryStorage;
      
      return mockMulter;
    });

    // Importer multer après avoir configuré le mock
    multer = require('multer');
  });

  afterEach(() => {
    jest.unmock('multer');
  });

  it('devrait configurer multer avec memoryStorage et les bonnes limites', () => {
    // Arrange
    const mockStorage = { _handleFile: jest.fn(), _removeFile: jest.fn() };
    multer.memoryStorage.mockReturnValue(mockStorage);

    // Act
    let uploadMiddleware;
    jest.isolateModules(() => {
      uploadMiddleware = require('../../../middleware/upload');
    });

    // Assert
    expect(multer.memoryStorage).toHaveBeenCalled();
    expect(multer).toHaveBeenCalledWith({
      storage: mockStorage,
      limits: { fileSize: 50 * 1024 * 1024 } // 50MB
    });
    expect(uploadMiddleware).toBeDefined();
    expect(typeof uploadMiddleware.single).toBe('function');
    expect(typeof uploadMiddleware.array).toBe('function');
  });

  it('devrait exporter les méthodes multer standard', () => {
    // Arrange
    const mockStorage = { _handleFile: jest.fn(), _removeFile: jest.fn() };
    multer.memoryStorage.mockReturnValue(mockStorage);

    // Act
    let uploadMiddleware;
    jest.isolateModules(() => {
      uploadMiddleware = require('../../../middleware/upload');
    });

    // Assert - Vérifier que les méthodes multer sont disponibles
    expect(uploadMiddleware.single).toBeDefined();
    expect(uploadMiddleware.array).toBeDefined();
    expect(uploadMiddleware.fields).toBeDefined();
    expect(uploadMiddleware.none).toBeDefined();
  });

  it('devrait utiliser la limite de 50MB', () => {
    // Arrange
    const mockStorage = { _handleFile: jest.fn(), _removeFile: jest.fn() };
    multer.memoryStorage.mockReturnValue(mockStorage);

    // Act
    jest.isolateModules(() => {
      require('../../../middleware/upload');
    });

    // Assert - Vérifier que multer est appelé avec la bonne limite
    expect(multer).toHaveBeenCalledWith({
      storage: mockStorage,
      limits: { fileSize: 52428800 } // 50MB en bytes
    });
  });
});