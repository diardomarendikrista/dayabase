const request = require('supertest');
const app = require('../../app');
const pool = require('../../config/db');

// Mock list of database queries
jest.mock('../../config/db', () => {
  return {
    query: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
  };
});

describe('Public Dashboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/public/dashboards/:token', () => {
    it('should return 200 and dashboard data for valid public token', async () => {
      const mockToken = 'valid-public-token';

      // Sequence of mock returns for the 3 queries in the controller using Promise.resolve

      // Dashboard Query
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'My Public Dashboard',
          description: 'A test dashboard',
          public_sharing_enabled: true,
          public_token: mockToken
        }]
      });

      // Filters Query
      pool.query.mockResolvedValueOnce({
        rows: []
      });

      // Questions Query
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            instance_id: 10,
            question_id: 101,
            question_name: 'Revenue Chart',
            chart_type: 'line',
            layout_config: {},
            filter_mappings: {},
            click_enabled: false
          }
        ]
      });

      const res = await request(app).get(`/api/public/dashboards/${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body.name).toBe('My Public Dashboard');
      expect(res.body.questions).toHaveLength(1);
      expect(res.body.questions[0].name).toBe('Revenue Chart');
    });

    it('should return 404 if dashboard does not exist', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/public/dashboards/invalid-token');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should return 403 if dashboard exists but sharing is disabled', async () => {
      // 1. Dashboard Query (sharing disabled)
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Private Dash',
          public_sharing_enabled: false,
          public_token: 'secret-token'
        }]
      });

      const res = await request(app).get('/api/public/dashboards/secret-token');
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not publicly shared/i);
    });
  });
});
