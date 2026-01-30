const request = require('supertest');
const pool = require('../../config/db');
const { decrypt } = require('../../utils/crypto');
const app = require('../../app');

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
    query: jest.fn().mockResolvedValue({ rows: [{ col: 'val' }] }), // For Postgres mock
    execute: jest.fn().mockResolvedValue([[{ col: 'val' }]]), // For MySQL mock
    end: jest.fn(),
    destroy: jest.fn()
  })
}));
jest.mock('../../utils/sqlParser', () => ({
  parseSqlWithParameters: jest.fn().mockReturnValue({
    finalSql: 'SELECT * FROM table LIMIT 1000',
    queryValues: []
  })
}));

jest.mock('../../middleware/authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'ADMIN' };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next())
}));

describe('Query API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/query/run', () => {
    it('should execute a valid Select query', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          db_type: 'postgres',
          host: 'localhost',
          port: 5432,
          db_user: 'user',
          password_encrypted: { iv: 'iv', content: 'enc' },
          database_name: 'testdb'
        }]
      });

      const res = await request(app).post('/api/query/run').send({
        sql: 'SELECT * FROM table',
        connectionId: 1
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ col: 'val' }]);
    });

    it('should return 400 for SQL injection attempts (multiple statements)', async () => {
      const res = await request(app).post('/api/query/run').send({
        sql: 'SELECT * FROM table; DROP TABLE table',
        connectionId: 1
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Multiple statements/);
    });

    it('should return 400 for non-SELECT queries', async () => {
      const res = await request(app).post('/api/query/run').send({
        sql: 'INSERT INTO table VALUES (1)',
        connectionId: 1
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Only SELECT/);
    });
  });
});
