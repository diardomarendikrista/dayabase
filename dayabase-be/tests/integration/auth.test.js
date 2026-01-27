const request = require('supertest');
const app = require('../../app');
const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/setup-status', () => {
    it('should return needsSetup: true if no users exist', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const res = await request(app).get('/api/auth/setup-status');

      expect(res.status).toBe(200);
      expect(res.body.needsSetup).toBe(true);
    });

    it('should return needsSetup: false if users exist', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const res = await request(app).get('/api/auth/setup-status');

      expect(res.status).toBe(200);
      expect(res.body.needsSetup).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'ADMIN',
      password_hash: 'hashedpassword'
    };

    it('should login successfully with correct credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValue('mock-token');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token', 'mock-token');
      expect(res.body.user).toHaveProperty('email', mockUser.email);
    });

    it('should return 401 for incorrect password', async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false); // Password mismatch

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/incorrect email or password/i);
    });

    it('should return 401 for non-existent user', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No user found

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });
});
