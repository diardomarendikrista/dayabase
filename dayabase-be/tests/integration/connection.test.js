const request = require('supertest');
const pool = require('../../config/db');
const { encrypt } = require('../../utils/crypto');

// Mock dependencies
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));
jest.mock('../../utils/crypto', () => ({
  encrypt: jest.fn(() => ({ iv: 'iv', content: 'encrypted' })),
  decrypt: jest.fn(() => 'password')
}));
jest.mock('../../config/databaseConnector', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({
    end: jest.fn(),
    destroy: jest.fn()
  })
}));

jest.mock('../../middleware/authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'ADMIN' };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next())
}));

const app = require('../../app');

describe('Connection API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/connections', () => {
    it('should return all connections', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, connection_name: 'Prod DB' }]
      });
      const res = await request(app).get('/api/connections');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/connections', () => {
    it('should create a connection', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, connection_name: 'New DB' }]
      });

      const res = await request(app).post('/api/connections').send({
        connection_name: 'New DB',
        db_type: 'postgres',
        host: 'localhost',
        port: 5432,
        db_user: 'user',
        password: 'pass',
        database_name: 'db'
      });

      expect(res.status).toBe(201);
      expect(res.body.connection_name).toBe('New DB');
    });
  });
});
