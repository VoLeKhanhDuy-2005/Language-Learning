import {
  joinQueue,
  leaveQueue,
  createRoom,
  joinRoom,
  cancelRoom,
} from './matchmaking.js';
import {
  startMatch,
  handleAnswer,
  handleDisconnect,
  handleRejoin,
  activeMatches,
} from './engine.js';

export function registerBattleHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('battle:queue:join', async ({ mode }) => {
      if (!['mcq', 'typing'].includes(mode))
        return socket.emit('battle:error', { code: 'INVALID_MODE' });
      const paired = joinQueue(socket, mode);
      if (!paired) return;

      const opponentSocket = io.sockets.sockets.get(paired.opponent.socketId);
      if (!opponentSocket)
        return socket.emit('battle:error', { code: 'OPPONENT_UNAVAILABLE' });

      try {
        await startMatch(socket, opponentSocket, mode, 'queue');
      } catch (e) {
        console.warn('[battle] startMatch (queue) failed:', e);
        socket.emit('battle:error', { code: 'MATCH_START_FAILED' });
        opponentSocket.emit('battle:error', { code: 'MATCH_START_FAILED' });
      }
    });

    socket.on('battle:queue:leave', () => leaveQueue(socket.id));

    socket.on('battle:room:create', ({ mode }) => {
      if (!['mcq', 'typing'].includes(mode))
        return socket.emit('battle:error', { code: 'INVALID_MODE' });
      const code = createRoom(socket, mode);
      socket.emit('battle:room:created', { code });
    });

    socket.on('battle:room:join', async ({ code }) => {
      const result = joinRoom(socket, code);
      if (!result)
        return socket.emit('battle:error', { code: 'ROOM_NOT_FOUND' });
      const hostSocket = io.sockets.sockets.get(result.hostSocketId);
      if (!hostSocket)
        return socket.emit('battle:error', { code: 'HOST_DISCONNECTED' });

      try {
        await startMatch(hostSocket, socket, result.mode, 'invite');
      } catch (e) {
        console.warn('[battle] startMatch (invite) failed:', e);
        socket.emit('battle:error', { code: 'MATCH_START_FAILED' });
        hostSocket.emit('battle:error', { code: 'MATCH_START_FAILED' });
      }
    });

    // Host cancels their open room before anyone joins.
    socket.on('battle:room:leave', () => {
      cancelRoom(socket.id);
      socket.emit('battle:room:left');
    });

    socket.on('battle:answer', (payload) => handleAnswer(socket, payload));
    socket.on('battle:rejoin', (payload) => handleRejoin(socket, payload));

    socket.on('battle:active_match:check', () => {
      const userId = socket.user?.id;
      if (!userId) return;
      for (const match of activeMatches.values()) {
        if (match.players[userId] && match.status !== 'finishing') {
          socket.emit('battle:active_match:found', { matchId: match.matchId });
          break;
        }
      }
    });

    socket.on('disconnect', () => {
      leaveQueue(socket.id);
      cancelRoom(socket.id);
      handleDisconnect(socket);
    });
  });
}
