// upload.test.js
describe('Middleware Upload', () => {
  let multer, fs, path;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Configurer les mocks
    jest.mock('multer', () => {
      const mockInstance = {
        single: jest.fn(),
        array: jest.fn(),
        fields: jest.fn()
      };
      const mockMulter = jest.fn(() => mockInstance);
      mockMulter.diskStorage = jest.fn();
      return mockMulter;
    });

    jest.mock('fs', () => ({
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn()
    }));

    jest.mock('path', () => ({
      join: jest.fn(() => '/chemin/uploads'),
      extname: jest.fn(() => '.jpg')
    }));

    // Importer les modules après avoir configuré les mocks
    multer = require('multer');
    fs = require('fs');
    path = require('path');
  });

  afterEach(() => {
    jest.unmock('multer');
    jest.unmock('fs');
    jest.unmock('path');
  });

  it('devrait configurer multer et créer le dossier', () => {
    // Arrange
    const uploadPath = '/chemin/uploads';
    path.join.mockReturnValue(uploadPath);
    fs.existsSync.mockReturnValue(false);

    // Act - Utiliser isolateModules pour garantir l'isolation
    let upload;
    jest.isolateModules(() => {
      upload = require('../../../middleware/upload');
    });

    // Assert
    expect(path.join).toHaveBeenCalled();
    expect(fs.existsSync).toHaveBeenCalledWith(uploadPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(uploadPath, { recursive: true });
    expect(multer).toHaveBeenCalled();
    expect(upload).toBeDefined();
  });
});