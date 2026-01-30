const request = require('supertest');
const pool = require('../../config/db');

// Mock dependencies
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../../middleware/authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'ADMIN' };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next())
}));

const app = require('../../app');

describe('Collection API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/collections', () => {
    it('should return all top-level collections', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Main Collection' }]
      });
      const res = await request(app).get('/api/collections');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/collections', () => {
    it('should create a collection', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, name: 'New Col', description: 'desc' }]
      });

      const res = await request(app).post('/api/collections').send({
        name: 'New Col',
        description: 'desc'
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Col');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/api/collections').send({
        description: 'desc'
      });
      expect(res.status).toBe(400);
    });
  });
});
