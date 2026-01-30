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

describe('Dashboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboards', () => {
    it('should return all dashboards', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Sales Dashboard' }]
      });

      const res = await request(app).get('/api/dashboards');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should return dashboards filtered by collectionId', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 2, name: 'Marketing', collection_id: 1 }]
      });
      const res = await request(app).get('/api/dashboards?collectionId=1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      // Verify query was called with param
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE collection_id = $1'),
        ['1']
      );
    });
  });

  describe('GET /api/dashboards/:id', () => {
    it('should return dashboard details', async () => {
      // Mock main dashboard query
      pool.query.mockResolvedValueOnce({
        rows: [{
          dashboard_id: 1,
          name: 'Sales',
          description: 'Desc',
          public_sharing_enabled: false,
          question_id: null // No questions
        }]
      });
      // Mock filters query
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/dashboards/1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Sales');
    });

    it('should return 404 if not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/dashboards/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/dashboards', () => {
    it('should create a dashboard', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 10, name: 'New Dash', description: 'Desc' }]
      });

      const res = await request(app)
        .post('/api/dashboards')
        .send({ name: 'New Dash', description: 'Desc' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Dash');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/api/dashboards').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/dashboards/:id', () => {
    it('should update dashboard', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Updated Name' }],
        rowCount: 1
      });

      const res = await request(app)
        .put('/api/dashboards/1')
        .send({ name: 'Updated Name', description: 'New Desc' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });
  });
});
