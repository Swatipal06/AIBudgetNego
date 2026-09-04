import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login & register).
 * Protects against brute-force attacks and registration spam.
 *
 * Configurable via environment variables:
 *   AUTH_RATE_LIMIT_WINDOW_MS  – window in milliseconds (default: 15 minutes)
 *   AUTH_RATE_LIMIT_MAX        – max attempts per window per IP (default: 10)
 */
const windowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const max = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10;

export const authRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,    // Disable X-RateLimit-* legacy headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many attempts, please try again later.',
    });
  },
});
