const request = require('supertest');
const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const { verifyToken, isAdmin } = require('../../middleware/authMiddleware');

// Mock dependencies
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('bcrypt');

// Mock Middleware
jest.mock('../../middleware/authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'ADMIN' }; // Default mock as Admin
    next();
  }),
  isAdmin: jest.fn((req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ message: "Access denied." });
    }
  })
}));

// Import app AFTER mocks
const app = require('../../app');

describe('User API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Middleware Mocks defaults
    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 1, role: 'ADMIN' };
      next();
    });
  });

  describe('GET /api/users', () => {
    it('should return all users for Admin', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'admin@test.com', role: 'ADMIN' }, { id: 2, email: 'user@test.com', role: 'VIEWER' }]
      });

      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 3, email: 'new@test.com', full_name: 'New User', role: 'VIEWER' }]
      });
      bcrypt.hash.mockResolvedValue('hashedpass');

      const res = await request(app).post('/api/users').send({
        email: 'new@test.com',
        password: 'password',
        fullName: 'New User',
        role: 'VIEWER'
      });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('new@test.com');
    });

    it('should return 409 if email already exists', async () => {
      const err = new Error('Duplicate');
      err.code = '23505';
      pool.query.mockRejectedValueOnce(err);
      bcrypt.hash.mockResolvedValue('hashedpass');

      const res = await request(app).post('/api/users').send({
        email: 'duplicate@test.com',
        password: 'password',
        fullName: 'Dup User',
        role: 'VIEWER'
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/registered/i);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should prevent deleting own account', async () => {
      // req.user.id is 1 (mocked)
      const res = await request(app).delete('/api/users/1');
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/cannot delete your own account/i);
    });

    it('should delete another user', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).delete('/api/users/2');
      expect(res.status).toBe(200);
    });
  });
});
