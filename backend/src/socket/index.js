import { Server } from 'socket.io';
import { socketAuthMiddleware } from './auth.socket.js';
import { registerBattleHandlers } from './battle/index.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
