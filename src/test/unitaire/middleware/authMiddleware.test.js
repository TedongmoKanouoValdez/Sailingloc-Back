const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middleware/authMiddleware'); 

jest.mock('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret-key';

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('devrait renvoyer 401 si aucun token', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devrait renvoyer 401 si token invalide', () => {
    req.headers.authorization = 'Bearer invalid';
    jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });
    
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devrait appeler next() si token valide', () => {
    req.headers.authorization = 'Bearer valid';
    jwt.verify.mockReturnValue({ userId: 1 });
    
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});