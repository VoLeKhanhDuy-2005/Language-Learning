import { Server } from 'socket.io';
import { socketAuthMiddleware } from './auth.socket.js';
import { registerBattleHandlers } from './battle/index.js';

let io;

export const initSocket = (httpServer) => {
  const allowedOrigins = (
    process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:4173'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(
            new Error(`Socket CORS: origin '${origin}' không được phép`)
          );
        }
      },
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  registerBattleHandlers(io);

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
