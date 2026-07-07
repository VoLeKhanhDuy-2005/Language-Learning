import { BATTLE } from '../../config/gamification.config.js';
import { getIo } from '../index.js';

const queue = []; // [{ userId, socketId, mode, timer }]

export const joinQueue = (socket, mode) => {
  const userId = socket.user.id;

  const opponentIdx = queue.findIndex(
    (q) => q.mode === mode && q.userId !== userId
  );

  if (opponentIdx !== -1) {
    const opponent = queue[opponentIdx];
    clearTimeout(opponent.timer);
    queue.splice(opponentIdx, 1);
    return {
      opponent: { socketId: opponent.socketId, userId: opponent.userId },
    };
  }

  if (queue.some((q) => q.userId === userId)) return null;

  const socketId = socket.id;
  const timer = setTimeout(() => {
    getIo().to(socketId).emit('battle:queue:timeout');
    leaveQueue(socketId);
  }, BATTLE.queueTimeoutMs);

  queue.push({ userId, socketId, mode, timer });
  return null;
};

export const leaveQueue = (socketId) => {
  const idx = queue.findIndex((q) => q.socketId === socketId);
  if (idx !== -1) {
    clearTimeout(queue[idx].timer);
    queue.splice(idx, 1);
  }
};

// ---- invite codes (private rooms) ----

const invites = new Map(); // code -> { hostUserId, socketId, mode }

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const genCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
};

// A private room has no expiry
export const createRoom = (socket, mode) => {
  // One room per host: drop any room this socket already owns first.
  cancelRoom(socket.id);

  let code = genCode();
  while (invites.has(code)) code = genCode();

  invites.set(code, {
    hostUserId: socket.user.id,
    socketId: socket.id,
    mode,
  });
  return code;
};

export const joinRoom = (socket, code) => {
  const invite = invites.get(code);
  if (!invite) return null;
  // Host can't join their own room.
  if (invite.hostUserId === socket.user.id) return null;

  invites.delete(code);
  return {
    hostSocketId: invite.socketId,
    hostUserId: invite.hostUserId,
    mode: invite.mode,
  };
};

// Drop any room hosted by this socket (host disconnect, or before opening a new one).
export const cancelRoom = (socketId) => {
  for (const [code, invite] of invites) {
    if (invite.socketId === socketId) {
      invites.delete(code);
    }
  }
};
