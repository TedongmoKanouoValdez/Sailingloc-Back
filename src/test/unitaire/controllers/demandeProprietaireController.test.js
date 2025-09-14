const demandeController = require('../../../controllers/demandeProprietaireController');
const demandeService = require('../../../services/demandeProprietaireService');

// Mock du service
jest.mock('../../../services/demandeProprietaireService');

describe('Demande Controller - postDemande', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup des objets req et res
    req = {
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  it('devrait créer une demande avec succès', async () => {
    // Arrange
    req.body = {
      userId: '1',
      nomComplet: 'John Doe',
      raison: 'Je veux devenir propriétaire'
    };
    
    // Mock du service
    const mockDemande = { id: 123 };
    demandeService.createDemande.mockResolvedValue(mockDemande);
    demandeService.notifyAdmin.mockResolvedValue({});

    // Act
    await demandeController.postDemande(req, res);

    // Assert
    expect(demandeService.createDemande).toHaveBeenCalledWith(1, {
      nomComplet: 'John Doe',
      raison: 'Je veux devenir propriétaire'
    });
    expect(demandeService.notifyAdmin).toHaveBeenCalledWith(1, 123, 'John Doe');
    expect(res.json).toHaveBeenCalledWith({ 
      message: "Demande enregistrée avec succès !" 
    });
  });

  it('devrait retourner une erreur 401 si userId manquant', async () => {
    // Arrange
    req.body = {
      nomComplet: 'John Doe',
      raison: 'Test'
    };

    // Act
    await demandeController.postDemande(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Vous devez être connecté pour soumettre une demande de partenariat."
    });
    expect(demandeService.createDemande).not.toHaveBeenCalled();
  });

  it('devrait retourner une erreur 401 si userId invalide', async () => {
    // Arrange
    req.body = {
      userId: 'invalid',
      nomComplet: 'John Doe',
      raison: 'Test'
    };

    // Act
    await demandeController.postDemande(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Vous devez être connecté pour soumettre une demande de partenariat."
    });
    expect(demandeService.createDemande).not.toHaveBeenCalled();
  });

  it('devrait gérer les erreurs DAILY_LIMIT', async () => {
    // Arrange
    req.body = {
      userId: '1',
      nomComplet: 'John Doe',
      raison: 'Test'
    };
    
    // Mock de l'erreur daily limit
    const dailyLimitError = new Error("Vous avez déjà envoyé une demande aujourd'hui.");
    dailyLimitError.code = "DAILY_LIMIT";
    demandeService.createDemande.mockRejectedValue(dailyLimitError);

    // Act
    await demandeController.postDemande(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Vous avez déjà envoyé une demande aujourd'hui."
    });
  });

  it('devrait gérer les erreurs WEEKLY_LIMIT', async () => {
    // Arrange
    req.body = {
      userId: '1',
      nomComplet: 'John Doe',
      raison: 'Test'
    };
    
    // Mock de l'erreur weekly limit
    const weeklyLimitError = new Error("Vous pourrez refaire une demande à partir du 05/01/2024.");
    weeklyLimitError.code = "WEEKLY_LIMIT";
    demandeService.createDemande.mockRejectedValue(weeklyLimitError);

    // Act
    await demandeController.postDemande(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Vous pourrez refaire une demande à partir du 05/01/2024."
    });
  });

  it('devrait gérer les erreurs serveur génériques', async () => {
    // Arrange
    req.body = {
      userId: '1',
      nomComplet: 'John Doe',
      raison: 'Test'
    };
    
    // Mock d'une erreur générique
    const serverError = new Error("Erreur base de données");
    demandeService.createDemande.mockRejectedValue(serverError);

    // Mock de console.error pour éviter le bruit
    console.error = jest.fn();

    // Act
    await demandeController.postDemande(req, res);

    // Assert
    expect(console.error).toHaveBeenCalledWith(serverError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Erreur serveur."
    });
  });

  it('devrait gérer les erreurs de notification', async () => {
    // Arrange
    req.body = {
      userId: '1',
      nomComplet: 'John Doe',
      raison: 'Test'
    };
    
    // Mock de la création réussie mais échec de notification
    const mockDemande = { id: 123 };
    demandeService.createDemande.mockResolvedValue(mockDemande);
    
    const notificationError = new Error("Erreur envoi notification");
    demandeService.notifyAdmin.mockRejectedValue(notificationError);

    // Mock de console.error
    console.error = jest.fn();

    // Act
    await demandeController.postDemande(req, res);

    // Assert
    expect(console.error).toHaveBeenCalledWith(notificationError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Erreur serveur."
    });
  });
});