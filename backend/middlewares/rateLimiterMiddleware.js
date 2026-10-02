import rateLimit from 'express-rate-limit';

/**
 * Protect authentication APIs from brute-force attacks.
 * Limit: 30 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

/**
 * Prevent excessive general API usage and abuse.
 * Limit: 200 requests per 1 minute per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after a minute',
  },
});

/**
 * Limit AI requests to prevent excessive LLM usage and API cost.
 * Limit: 60 requests per 1 minute per IP.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests, please try again later.',
  },
});
