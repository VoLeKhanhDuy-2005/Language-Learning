import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';
import { COMMON, AUTH } from '../constants/codes/index.js';
import User from '../models/user.model.js';
import redisClient from '../config/redis.js';

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError(COMMON.UNAUTHORIZED, 401));
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.type !== 'ACCESS') {
      return next(new AppError(AUTH.INVALID_TOKEN, 401));
    }

    const redisKey = `user:auth:${decoded.id}`;
    let user;
    
    if (redisClient.isOpen) {
      const cachedUser = await redisClient.get(redisKey);
      if (cachedUser) {
        user = JSON.parse(cachedUser);
        if (user.passwordChangedAt) {
          user.passwordChangedAt = new Date(user.passwordChangedAt);
        }
      }
    }

    if (!user) {
      user = await User.findById(decoded.id).select('isActive passwordChangedAt banReason').lean();
      if (user && redisClient.isOpen) {
        await redisClient.set(redisKey, JSON.stringify(user), { EX: parseInt(process.env.JWT_ACCESS_EXPIRES_IN) });
      }
    }
    if (!user || !user.isActive) {
      return next(
        new AppError(
          AUTH.ACCOUNT_BANNED,
          401,
          [],
          user?.banReason ? `Account has been locked: ${user.banReason}` : undefined
        )
      );
    }

    if (
      user.passwordChangedAt &&
      decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return next(new AppError(AUTH.INVALID_TOKEN, 401));
    }

    req.user = decoded; // { id, role, ... }
    next();
  } catch (error) {
    return next(new AppError(AUTH.INVALID_TOKEN, 401));
  }
};

// Optional auth: attach req.user when a valid Bearer token is present, but never reject. Missing/invalid/expired token anonymous request.
export const protectOptional = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.type === 'ACCESS') {
      const redisKey = `user:auth:${decoded.id}`;
      let user;

      if (redisClient.isOpen) {
        const cachedUser = await redisClient.get(redisKey);
        if (cachedUser) {
          user = JSON.parse(cachedUser);
          if (user.passwordChangedAt) {
            user.passwordChangedAt = new Date(user.passwordChangedAt);
          }
        }
      }

      if (!user) {
        user = await User.findById(decoded.id).select('isActive passwordChangedAt banReason').lean();
        if (user && redisClient.isOpen) {
          await redisClient.set(redisKey, JSON.stringify(user), { EX: parseInt(process.env.JWT_ACCESS_EXPIRES_IN)});
        }
      }
      if (user && user.isActive) {
        if (!user.passwordChangedAt || decoded.iat >= Math.floor(user.passwordChangedAt.getTime() / 1000)) {
          req.user = decoded;
        }
      }
    }
  } catch (error) {
    // Ignore invalid/expired token; proceed as anonymous.
  }

  return next();
};
