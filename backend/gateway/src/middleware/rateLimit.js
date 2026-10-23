import { redis } from '../redis.js';

// Fixed-window limiter backed by Redis, so the limit is shared by every gateway replica.
export function rateLimit({ windowSec = 60, max = 100, prefix = 'rl' } = {}) {
  return async (req, res, next) => {
    try {
      const key = `${prefix}:${req.ip}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSec);
      if (count > max) {
        res.set('Retry-After', String(windowSec));
        return res.status(429).json({ message: 'too many requests, try again shortly' });
      }
    } catch {
      // If Redis is down, let the request through instead of blocking everyone.
    }
    next();
  };
}
