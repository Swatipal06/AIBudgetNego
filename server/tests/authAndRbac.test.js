import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { requireRole } from '../src/middleware/roleMiddleware.js';
import { protect } from '../src/middleware/authMiddleware.js';
import { register, updateUserRole } from '../src/controllers/authController.js';
import User from '../src/models/User.js';

describe('Authentication & Role-Based Authorization (RBAC)', () => {
  const TEST_JWT_SECRET = 'test_jwt_secret_for_auth_rbac_suite';
  let originalSecret;

  beforeAll(() => {
    // Ensure JWT_SECRET is always set for this test suite,
    // replacing the removed hardcoded fallback.
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  test('18. User model generates valid JWT containing user ID and role', () => {
    const mockUser = new User({
      name: 'Sarah Chen',
      email: 'admin@enterprise.ai',
      password: 'HashedPassword123',
      role: 'ADMIN',
    });

    const token = mockUser.generateAuthToken();
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, TEST_JWT_SECRET);
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

  test('26. register endpoint strictly assigns VIEWER role, ignoring self-assigned ADMIN in request body', async () => {
    const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const createSpy = jest.spyOn(User, 'create').mockImplementation(async (userData) => ({
      ...userData,
      _id: 'user_new_123',
      generateAuthToken: () => 'mock_token',
    }));

    const req = {
      body: {
        name: 'Eve Attacker',
        email: 'eve@enterprise.ai',
        password: 'Password123',
        role: 'ADMIN', // Attempt privilege escalation
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

    await register(req, res, () => {});

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Eve Attacker',
        email: 'eve@enterprise.ai',
        role: 'VIEWER',
      })
    );
    expect(statusCode).toBe(201);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.user.role).toBe('VIEWER');

    findOneSpy.mockRestore();
    createSpy.mockRestore();
  });

  test('27. updateUserRole allows an ADMIN to promote a user to ADMIN', async () => {
    const mockUser = {
      _id: 'user_promotee_123',
      name: 'Bob Auditor',
      email: 'bob@enterprise.ai',
      role: 'VIEWER',
      save: jest.fn().mockResolvedValue(true),
    };
    const findByIdSpy = jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

    const req = {
      params: { id: 'user_promotee_123' },
      body: { role: 'ADMIN' },
      user: {
        _id: 'admin_123',
        email: 'admin@enterprise.ai',
        role: 'ADMIN',
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

    await updateUserRole(req, res, () => {});

    expect(mockUser.role).toBe('ADMIN');
    expect(mockUser.save).toHaveBeenCalled();
    expect(statusCode).toBe(200);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.user.role).toBe('ADMIN');

    findByIdSpy.mockRestore();
  });

  test('28. requireRole("ADMIN") prevents non-ADMIN users from reaching role update route', () => {
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
});
