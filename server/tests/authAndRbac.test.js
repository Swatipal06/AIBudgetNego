import jwt from 'jsonwebtoken';
import { requireRole } from '../src/middleware/roleMiddleware.js';
import { protect } from '../src/middleware/authMiddleware.js';
import User from '../src/models/User.js';

describe('Authentication & Role-Based Authorization (RBAC)', () => {
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_negotiating_budget_2026';

  test('18. User model generates valid JWT containing user ID and role', () => {
    const mockUser = new User({
      name: 'Sarah Chen',
      email: 'admin@enterprise.ai',
      password: 'HashedPassword123',
      role: 'ADMIN',
    });

    const token = mockUser.generateAuthToken();
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, secret);
    expect(decoded.email).toBe('admin@enterprise.ai');
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.name).toBe('Sarah Chen');
  });

  test('19. requireRole("ADMIN") strictly FORBIDS (HTTP 403) a VIEWER user', () => {
    const req = {
      user: {
        _id: 'viewer_123',
        email: 'viewer@enterprise.ai',
        role: 'VIEWER',
      },
    };

    let statusCode = 0;
    let jsonResponse = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
          },
        };
      },
    };

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    const adminMiddleware = requireRole('ADMIN');
    adminMiddleware(req, res, next);

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(403);
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.message).toContain('Forbidden');
  });

  test('20. requireRole("ADMIN") grants access (calls next) for an ADMIN user', () => {
    const req = {
      user: {
        _id: 'admin_123',
        email: 'admin@enterprise.ai',
        role: 'ADMIN',
      },
    };

    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    const adminMiddleware = requireRole('ADMIN');
    adminMiddleware(req, res, next);

    expect(nextCalled).toBe(true);
  });

  test('21. protect middleware rejects requests missing Authorization Bearer token with HTTP 401', async () => {
    const req = { headers: {} };
    let statusCode = 0;
    let jsonResponse = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await protect(req, res, next);

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(401);
    expect(jsonResponse.message).toContain('Not authorized');
  });
});
