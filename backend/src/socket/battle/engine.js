import { BattleMatch } from '../../models/battleMatch.model.js';
import User from '../../models/user.model.js';
import {
  generateQuestions,
  normalize,
} from '../../modules/battle/battle.service.js';
import {
  recordActivity,
  awardXp,
  touchStreak,
} from '../../modules/gamification/gamification.service.js';
import { BATTLE, XP } from '../../config/gamification.config.js';
import { getIo } from '../index.js';

// matchId (string) -> liveState
export const activeMatches = new Map();

// Load { userId, name, avatarUrl } for a set of user ids, keyed by userId string.
async function loadProfiles(userIds) {
  const users = await User.find({ _id: { $in: userIds } })
    .select('name avatarUrl')
    .lean();
  const map = {};
  for (const u of users) {
    const id = u._id.toString();
    map[id] = { userId: id, name: u.name, avatarUrl: u.avatarUrl };
  }
  return map;
}

export async function startMatch(socket1, socket2, mode, matchType = 'queue') {
  const io = getIo();

  const userId1 = socket1.user.id;
  const userId2 = socket2.user.id;

  // 1. Generate questions + load both players' profiles (name/avatar) once.
  const [questions, profiles] = await Promise.all([
    generateQuestions(BATTLE.rounds, mode),
    loadProfiles([userId1, userId2]),
  ]);

  // 2. Persist match doc.
  const match = await BattleMatch.create({
    mode,
    matchType,
    status: 'in_progress',
    players: [{ userId: userId1 }, { userId: userId2 }],
    questions,
    startedAt: new Date(),
  });

  const matchId = match._id.toString();

  // 3. Join both sockets into the match room + tag for lookup in handleAnswer.
  socket1.join(matchId);
  socket2.join(matchId);
  socket1.currentMatchId = matchId;
  socket2.currentMatchId = matchId;

  // 4. Init live state.
  const liveState = {
    matchId,
    mode,
    matchType, // 'queue' awards ranked XP; 'invite' (private) does not
    players: {
      [userId1]: {
        userId: userId1,
        socketId: socket1.id,
        score: 0,
        correctCount: 0,
        answeredThisRound: false,
        connected: true,
      },
      [userId2]: {
        userId: userId2,
        socketId: socket2.id,
        score: 0,
        correctCount: 0,
        answeredThisRound: false,
        connected: true,
      },
    },
    questions,
    profiles, // userId -> { userId, name, avatarUrl }
    currentRound: 0,
    currentDeadlineTs: null,
    roundTimer: null,
    revealTimer: null,
    startTimer: null,
    graceTimers: {}, // userId -> reconnect grace setTimeout handle
  };
  activeMatches.set(matchId, liveState);

  // 5. Pre-game countdown — let both clients render the battle screen before the
  //    first question's timer starts. Round 0 only begins after the countdown.
  io.to(matchId).emit('battle:starting', {
    countdownMs: BATTLE.startCountdownMs,
    mode,
    total: questions.length,
    players: [
      profiles[userId1] || { userId: userId1 },
      profiles[userId2] || { userId: userId2 },
    ],
    matchId
  });
  liveState.startTimer = setTimeout(
    () => runRound(liveState, io),
    BATTLE.startCountdownMs
  );

  return match;
}

function runRound(liveState, io) {
  const { matchId, mode, currentRound, questions } = liveState;

  // 1. Reset per-round answer flags.
  for (const player of Object.values(liveState.players)) {
    player.answeredThisRound = false;
  }

  // 2. Current question.
  const question = questions[currentRound];

  // 3. Deadline — stash on the question for scoring in handleAnswer.
  const deadlineTs = Date.now() + BATTLE.perQuestionMs;
  question.deadlineTs = deadlineTs;
  liveState.currentDeadlineTs = deadlineTs;

  // 4. Broadcast question (never leak correctAnswer).
  io.to(matchId).emit('battle:question', {
    index: currentRound,
    total: questions.length,
    term: question.term,
    mode,
    options: question.options,
    deadlineTs,
    ...(mode === 'typing' && {
      answerLength: question.answerLength,
      answerPattern: question.answerPattern,
      firstChar: question.firstChar,
    }),
  });

  // 5. Round timer — fires if not everyone answered in time.
  liveState.roundTimer = setTimeout(
    () => advanceRound(liveState, io),
    BATTLE.perQuestionMs
  );
}

export function handleAnswer(socket, { index, answer }) {
  // 1. Locate live state via the room tagged on the socket.
  const matchId = socket.currentMatchId;
  if (!matchId) return;
  const liveState = activeMatches.get(matchId);
  if (!liveState) return;

  const userId = socket.user.id;
  const player = liveState.players[userId];
  if (!player) return;

  // 2. Validate: right round, not already answered.
  if (index !== liveState.currentRound) return;
  if (player.answeredThisRound) return;

  const question = liveState.questions[index];
  if (!question) return;

  // 4. Score with speed bonus.
  const remainingMs = Math.max(0, question.deadlineTs - Date.now());
  const correct =
    liveState.mode === 'mcq'
      ? answer === question.correctAnswer
      : normalize(answer ?? '') === question.correctAnswer;
  const score = correct
    ? 100 +
    Math.round((BATTLE.speedBonusMax * remainingMs) / BATTLE.perQuestionMs)
    : 0;

  // 5. Apply.
  player.score += score;
  if (correct) player.correctCount += 1;
  player.answeredThisRound = true;

  // 6. Both answered -> end round early.
  const allAnswered = Object.values(liveState.players).every(
    (p) => p.answeredThisRound
  );
  if (allAnswered) {
    clearTimeout(liveState.roundTimer);
    advanceRound(liveState, getIo());
  }
}

function advanceRound(liveState, io) {
  // Guard against double-advance (timer + early finish race).
  clearTimeout(liveState.roundTimer);

  const { matchId, currentRound, questions } = liveState;
  const question = questions[currentRound];

  // 1. Round result — reveal answer + cumulative scores.
  const scores = {};
  for (const player of Object.values(liveState.players)) {
    scores[player.userId] = player.score;
  }
  io.to(matchId).emit('battle:roundResult', {
    index: currentRound,
    correctAnswer: question.correctAnswer,
    scores,
  });

  // 2. Next round.
  liveState.currentRound += 1;

  // 3 / 4. Pause on the reveal so clients can show the answer + scores before the next question.
  if (liveState.currentRound < questions.length) {
    liveState.revealTimer = setTimeout(
      () => runRound(liveState, io),
      BATTLE.roundRevealMs
    );
  } else {
    finalizeMatch(liveState, io);
  }
}

// ---- finalize match + reward hooks ----

async function finalizeMatch(liveState, io) {
  if (liveState.status === 'finishing') return;
  liveState.status = 'finishing';
  clearTimeout(liveState.roundTimer);
  clearTimeout(liveState.revealTimer);
  clearTimeout(liveState.startTimer);
  for (const t of Object.values(liveState.graceTimers)) clearTimeout(t);

  const { matchId } = liveState;
  const players = Object.values(liveState.players);

  // 2. Winner
  const [p1, p2] = players;
  let winnerId = null;
  if (p1.score > p2.score) winnerId = p1.userId;
  else if (p2.score > p1.score) winnerId = p2.userId;

  // 3. Persist final state.
  const scores = {};
  for (const player of players) scores[player.userId] = player.score;

  try {
    await BattleMatch.updateOne(
      { _id: matchId },
      {
        $set: {
          status: 'finished',
          finishedAt: new Date(),
          winnerId,
          players: players.map((p) => ({
            userId: p.userId,
            score: p.score,
            correctCount: p.correctCount,
            connected: p.connected,
          })),
        },
      }
    );
  } catch (e) {
    console.warn('[battle] finalize persist failed:', e);
  }

  // 4. Notify room.
  io.to(matchId).emit('battle:finished', {
    scores,
    winnerId,
    players: players.map((p) => ({
      ...(liveState.profiles?.[p.userId] || { userId: p.userId }),
      score: p.score,
      correctCount: p.correctCount,
      connected: p.connected,
    })),
  });

  // 5. Drop live state.
  activeMatches.delete(matchId);

  // 6. Rewards. Each call isolated so gamification errors never crash the match.
  await grantRewards(liveState, players, winnerId);
}

// Shared reward logic for finish + forfeit.
// Rules:
//  - Streak always counts (player did real learning this match).
//  - battle_play XP (+15) only for ranked (queue) matches AND if the player hit
//    the min-correct effort threshold — stops "join + answer garbage" farming.
//  - battle_win XP (+35) only for ranked matches AND if the winner also hit the
//    threshold — no reward for winning purely on an opponent's collapse.
//  - Invite (private) matches grant NO action XP at all (anti-collusion).
async function grantRewards(liveState, players, winnerId) {
  const matchId = liveState.matchId.toString();
  const ranked = liveState.matchType === 'queue';
  const MIN = BATTLE.minCorrectForReward;

  for (const player of players) {
    const earnsPlayXp = ranked && player.correctCount >= MIN;
    try {
      if (earnsPlayXp) {
        // recordActivity grants +15 AND updates streak (idempotent per day).
        await recordActivity(player.userId, 'battle_play', matchId);
      } else {
        // Streak only
        await touchStreak(player.userId);
      }
    } catch (e) {
      console.warn('[battle] play reward/streak failed:', e);
    }
  }

  if (ranked && winnerId) {
    const winner = players.find((p) => p.userId === winnerId);
    if (winner && winner.correctCount >= MIN) {
      try {
        await awardXp(winnerId, 'battle_win', matchId, XP.battleWin);
      } catch (e) {
        console.warn('[battle] battle_win reward failed:', e);
      }
    }
  }
}

// ---- disconnect / reconnect / forfeit ----

export function handleDisconnect(socket) {
  const io = getIo();

  // 1. Locate live state.
  let liveState = socket.currentMatchId
    ? activeMatches.get(socket.currentMatchId)
    : null;
  if (!liveState) {
    for (const state of activeMatches.values()) {
      if (Object.values(state.players).some((p) => p.socketId === socket.id)) {
        liveState = state;
        break;
      }
    }
  }
  if (!liveState) return;

  const userId = socket.user?.id;
  const player = userId ? liveState.players[userId] : null;
  if (!player) return;

  // Ignore a stale socket's disconnect: if the player already rebound to a new
  // socket (reconnected), this delayed disconnect must NOT mark them offline,
  // otherwise a connected player gets forfeited by mistake.
  if (player.socketId !== socket.id) return;

  // 2. Only meaningful while the match is live.
  if (liveState.status === 'finishing') return;

  // 3. Mark disconnected.
  player.connected = false;

  // 4. Notify the opponent.
  socket
    .to(liveState.matchId)
    .emit('battle:opponentDisconnected', { userId: player.userId });

  // 5. Grace timer — forfeit (or abandon) if not back in time.
  clearTimeout(liveState.graceTimers[player.userId]);
  liveState.graceTimers[player.userId] = setTimeout(() => {
    if (!activeMatches.has(liveState.matchId)) return;
    const opponent = Object.values(liveState.players).find(
      (p) => p.userId !== player.userId
    );
    if (opponent && opponent.connected) {
      finalizeAsForfeit(liveState, io, player.userId);
    } else {
      abandonMatch(liveState, io);
    }
  }, BATTLE.reconnectGraceMs);
}

export function handleRejoin(socket, { matchId }) {
  // 1 / 2. Validate.
  const liveState = activeMatches.get(matchId);
  const userId = socket.user?.id;
  const player = liveState && userId ? liveState.players[userId] : null;
  if (!liveState || liveState.status === 'finishing' || !player) {
    socket.emit('battle:error', { code: 'MATCH_NOT_FOUND' });
    return;
  }

  // 4. Cancel the grace timer.
  clearTimeout(liveState.graceTimers[userId]);
  delete liveState.graceTimers[userId];

  // 5. Rebind the (new) socket.
  player.connected = true;
  player.socketId = socket.id;
  socket.currentMatchId = matchId;

  // 6. Join room + 7. resync current round state.
  socket.join(matchId);
  const q = liveState.questions[liveState.currentRound];
  socket.emit('battle:rejoined', {
    currentRound: liveState.currentRound,
    total: liveState.questions.length,
    term: q.term,
    mode: liveState.mode,
    options: q.options,
    deadlineTs: liveState.currentDeadlineTs,
    ...(liveState.mode === 'typing' && {
      answerLength: q.answerLength,
      answerPattern: q.answerPattern,
      firstChar: q.firstChar,
    }),
  });

  // Let the opponent know.
  socket.to(matchId).emit('battle:opponentReconnected', { userId });
}

async function finalizeAsForfeit(liveState, io, forfeitUserId) {
  if (liveState.status === 'finishing') return;
  liveState.status = 'finishing';
  clearTimeout(liveState.roundTimer);
  clearTimeout(liveState.revealTimer);
  clearTimeout(liveState.startTimer);
  for (const t of Object.values(liveState.graceTimers)) clearTimeout(t);

  const { matchId } = liveState;
  const players = Object.values(liveState.players);

  // 1. Winner = the player who did not forfeit.
  const winner = players.find((p) => p.userId !== forfeitUserId);
  const winnerId = winner ? winner.userId : null;

  // 2. Persist.
  try {
    await BattleMatch.updateOne(
      { _id: matchId },
      {
        $set: {
          status: 'finished',
          finishedAt: new Date(),
          winnerId,
          players: players.map((p) => ({
            userId: p.userId,
            score: p.score,
            correctCount: p.correctCount,
            connected: p.connected,
          })),
        },
      }
    );
  } catch (e) {
    console.warn('[battle] forfeit persist failed:', e);
  }

  const scores = {};
  for (const player of players) {
    scores[player.userId] = player.score;
  }

  // 3. Notify room — include winner profile + both players (with profiles) so the
  //    client can render the result screen without an extra fetch.
  io.to(matchId).emit('battle:opponentLeft', {
    winnerId,
    forfeitUserId,
    winner: winnerId
      ? liveState.profiles?.[winnerId] || { userId: winnerId }
      : null,
    scores,
    players: players.map((p) => ({
      ...(liveState.profiles?.[p.userId] || { userId: p.userId }),
      score: p.score,
      correctCount: p.correctCount,
      connected: p.connected,
    })),
  });

  // 5. Drop live state.
  activeMatches.delete(matchId);

  // 6. Rewards — only if at least one round was played. Same effort-gated rules
  //    as a normal finish (see grantRewards).
  if (liveState.currentRound < 1) return;
  await grantRewards(liveState, players, winnerId);
}

async function abandonMatch(liveState, io) {
  if (liveState.status === 'finishing') return;
  liveState.status = 'finishing';
  clearTimeout(liveState.roundTimer);
  clearTimeout(liveState.revealTimer);
  clearTimeout(liveState.startTimer);
  for (const t of Object.values(liveState.graceTimers)) clearTimeout(t);

  const { matchId } = liveState;

  // 1. Persist as abandoned.
  try {
    await BattleMatch.updateOne(
      { _id: matchId },
      { $set: { status: 'abandoned', finishedAt: new Date() } }
    );
  } catch (e) {
    console.warn('[battle] abandon persist failed:', e);
  }

  // 2. Notify + 3. drop. No rewards.
  io.to(matchId).emit('battle:abandoned');
  activeMatches.delete(matchId);
}
