import { verifyToken } from '../utils/jwt.js';

export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error('UNAUTHORIZED'));

  try {
    const decoded = verifyToken(token);
    if (decoded.type !== 'ACCESS') return next(new Error('UNAUTHORIZED'));
    socket.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
};
