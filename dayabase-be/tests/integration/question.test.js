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

// Mock QuestionService which is seemingly already used in the controller?
// The current controller uses QuestionService.getQuestionDetail (it seems partially refactored already or uses a service for read)
// But I need to mock the SERVICE if the controller imports it, OR mock the DB if the controller uses DB.
// Looking at the file content: `const QuestionService = require("../services/QuestionService");` is present!
// But create/update/delete use `pool.query` directly.
// Mix of Service and DB usage. This is exactly what we are fixing.
// For now, I will mock the DB responses because the "Refactor" step will move DB calls to Service.

const app = require('../../app');

describe('Question API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/questions', () => {
    it('should return all questions', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Q1' }]
      });
      const res = await request(app).get('/api/questions');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/questions', () => {
    it('should create a question', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, name: 'New Q' }]
      });

      const res = await request(app).post('/api/questions').send({
        name: 'New Q',
        sql_query: 'SELECT *',
        chart_type: 'bar',
        chart_config: {},
        connection_id: 1
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Q');
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('should delete a question', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).delete('/api/questions/1');
      expect(res.status).toBe(200);
    });
  });
});
