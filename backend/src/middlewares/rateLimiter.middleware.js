import AppError from '../utils/AppError.js';
import client from '../config/redis.js';
import { COMMON } from '../constants/codes/index.js';

export const rateLimiter = ({ windowMs, max, code } = {}) => {
  return async (req, res, next) => {
    if (!client.isOpen) {
      return next();
    }

    const forwarded = req.headers['x-forwarded-for'];
    const rawIp = forwarded
      ? forwarded.split(',')[0].trim()
      : req.ip || req.socket?.remoteAddress || 'unknown';

    const ip =
      rawIp === '::1'
        ? '127.0.0.1'
        : rawIp.startsWith('::ffff:')
          ? rawIp.replace('::ffff:', '')
          : rawIp;

    const path = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    const key = `ratelimit:${path}:${ip}`;

    try {
      const current = await client.incr(key);

      if (current === 1) {
        await client.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > max) {
        return next(new AppError(code || COMMON.RATE_LIMITED, 429));
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();
    }
  };
};
