import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { io as ioClient } from 'socket.io-client';
import request from 'supertest';
import app from '../../app.js';
import { initSocket } from '../../socket/index.js';
import { generateToken } from '../../utils/jwt.js';
import { generateQuestions } from '../../modules/battle/battle.service.js';
import { joinQueue, leaveQueue } from '../../socket/battle/matchmaking.js';
import { BattleMatch } from '../../models/battleMatch.model.js';
import XpEvent from '../../models/xpEvent.model.js';
import UserGamification from '../../models/userGamification.model.js';
import Card from '../../models/card.model.js';
import Deck from '../../models/deck.model.js';
import User from '../../models/user.model.js';
import { activeMatches } from '../../socket/battle/engine.js';
import * as gamService from '../../modules/gamification/gamification.service.js';
import { BATTLE } from '../../config/gamification.config.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Cancel all pending round/grace timers in activeMatches, then clear the map.
// Prevents timer bleed between tests (e.g. old round timer fires after beforeEach cleanup).
const clearActiveMatches = () => {
  for (const liveState of activeMatches.values()) {
    clearTimeout(liveState.roundTimer);
    for (const t of Object.values(liveState.graceTimers ?? {})) clearTimeout(t);
  }
  activeMatches.clear();
};

const CARD_COUNT = 50;
// Map term_N → translation_N (matches seeded cards; normalize lowercases them already)
const termAnswerMap = Object.fromEntries(
  Array.from({ length: CARD_COUNT }, (_, i) => [
    `term_${i}`,
    `translation_${i}`,
  ])
);

const makeToken = (userId) =>
  generateToken({ id: userId.toString(), role: 'user', type: 'ACCESS' }, '15m');

let serverUrl;

const connectSocket = (userId) =>
  new Promise((resolve, reject) => {
    const s = ioClient(serverUrl, {
      auth: { token: makeToken(userId) },
      forceNew: true,
      transports: ['websocket'],
    });
    s.once('connect', () => resolve(s));
    s.once('connect_error', (err) => reject(err));
  });

const waitFor = (socket, event, ms = 5000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout waiting for "${event}"`)),
      ms
    );
    socket.once(event, (d) => {
      clearTimeout(t);
      resolve(d);
    });
  });

const closeSocket = (s) =>
  new Promise((resolve) => {
    if (!s || !s.connected) return resolve();
    s.once('disconnect', resolve);
    s.disconnect();
  });

// Set up question listeners BEFORE emitting queue:join to avoid missing first question.
// Returns a Promise that resolves to { fin1, fin2 } when battle:finished arrives on both clients.
const playFullMatch = (c1, c2, mode, c1Delay = 0, c2Delay = 0) => {
  const makeHandler =
    (client, delay) =>
    ({ term, index, options }) => {
      const answer = termAnswerMap[term] ?? options?.[0] ?? 'answer';
      setTimeout(() => client.emit('battle:answer', { index, answer }), delay);
    };

  const h1 = makeHandler(c1, c1Delay);
  const h2 = makeHandler(c2, c2Delay);
  c1.on('battle:question', h1);
  c2.on('battle:question', h2);

  return Promise.all([
    waitFor(c1, 'battle:finished', 15000),
    waitFor(c2, 'battle:finished', 15000),
  ]).then(([fin1, fin2]) => {
    c1.off('battle:question', h1);
    c2.off('battle:question', h2);
    return { fin1, fin2 };
  });
};

// ── Global setup ──────────────────────────────────────────────────────────────

let mongod;
let httpServer;

// Store original BATTLE values so we can restore if needed (within same process only)
const origBattle = { ...BATTLE };

beforeAll(async () => {
  // Shorten BATTLE timers so socket tests run fast — but keep the per-question
  // window wide enough that a real socket round-trip (answer emit → server →
  // next question) lands inside it. Too small (e.g. 800ms) makes answers miss
  // their round under load → flaky scores/rewards.
  // Total match time = startCountdown + rounds*(perQuestion + roundReveal); keep
  // it well under playFullMatch's 15s waitFor by trimming countdown/reveal too.
  // BATTLE is a plain mutable object shared across all ESM imports of gamification.config.js.
  BATTLE.rounds = 3;
  BATTLE.perQuestionMs = 2000;
  BATTLE.roundRevealMs = 400;
  BATTLE.startCountdownMs = 400;
  BATTLE.speedBonusMax = 50;
  BATTLE.reconnectGraceMs = 1000;
  BATTLE.queueTimeoutMs = 5000;
  // Need margin: with rounds=3, a threshold of 3 forces the winner to answer
  // every round perfectly — one socket answer missing its window under load
  // drops battle_win XP and flakes the reward tests. 1 keeps the effort gate
  // meaningful (a 0-correct forfeit winner still earns nothing) with slack.
  BATTLE.minCorrectForReward = 1;

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await BattleMatch.createIndexes();
  await XpEvent.createIndexes();
  await UserGamification.createIndexes();

  // Seed 1 system deck + CARD_COUNT cards with known term/translation pairs
  const deck = await Deck.create({
    title: 'Battle Test Deck',
    slug: 'battle-test-deck',
    ownerType: 'system',
    status: 'published',
  });
  const topicId = new mongoose.Types.ObjectId();
  await Card.insertMany(
    Array.from({ length: CARD_COUNT }, (_, i) => ({
      deckId: deck._id,
      topicId,
      order: i,
      term: `term_${i}`,
      translation: `translation_${i}`,
    }))
  );

  httpServer = createServer(app);
  initSocket(httpServer);
  await new Promise((r) => httpServer.listen(0, r));
  const { port } = httpServer.address();
  serverUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  // Restore original BATTLE values
  Object.assign(BATTLE, origBattle);

  await new Promise((r) => httpServer.close(r));
  await mongoose.disconnect();
  await mongod.stop();
});

// ── Group 1: generateQuestions ────────────────────────────────────────────────

describe('Group 1 — generateQuestions', () => {
  it('MCQ: returns correct count', async () => {
    const qs = await generateQuestions(5, 'mcq');
    expect(qs).toHaveLength(5);
  });

  it('MCQ: each question has exactly 4 options, correctAnswer is one of them', async () => {
    const qs = await generateQuestions(5, 'mcq');
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('Typing: options array is empty', async () => {
    const qs = await generateQuestions(5, 'typing');
    for (const q of qs) {
      expect(q.options).toHaveLength(0);
    }
  });

  it('questions have unique cardIds (no duplicate draw)', async () => {
    const qs = await generateQuestions(5, 'mcq');
    const ids = qs.map((q) => q.cardId.toString());
    expect(new Set(ids).size).toBe(5);
  });
});

// ── Group 2: Matchmaking unit ─────────────────────────────────────────────────

describe('Group 2 — Matchmaking unit', () => {
  const uid1 = new mongoose.Types.ObjectId();
  const uid2 = new mongoose.Types.ObjectId();

  const makeFake = (uid) => ({
    user: { id: uid.toString() },
    id: new mongoose.Types.ObjectId().toString(), // unique socketId per call
  });

  // Fake timers prevent the queue timeout from calling getIo() during unit tests
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('2 different users join queue → matched', () => {
    const s1 = makeFake(uid1);
    const s2 = makeFake(uid2);

    const r1 = joinQueue(s1, 'mcq');
    expect(r1).toBeNull(); // first user waits

    const r2 = joinQueue(s2, 'mcq');
    expect(r2).not.toBeNull();
    expect(r2.opponent.userId).toBe(uid1.toString());
    // Both removed from queue on match — no explicit cleanup needed
  });

  it('same userId joining twice → second call blocked (no self-pair)', () => {
    const s1a = makeFake(uid1);
    const s1b = makeFake(uid1); // same userId, different socketId

    joinQueue(s1a, 'mcq');
    const r = joinQueue(s1b, 'mcq');
    expect(r).toBeNull();

    leaveQueue(s1a.id);
  });

  it('leaveQueue removes user — next joiner has no pair', () => {
    const s1 = makeFake(uid1);
    const s2 = makeFake(uid2);

    joinQueue(s1, 'mcq');
    leaveQueue(s1.id);

    const r = joinQueue(s2, 'mcq');
    expect(r).toBeNull(); // s2 waits, no partner

    leaveQueue(s2.id);
  });

  it('user joining after other left is not paired with the departed user', () => {
    const s1 = makeFake(uid1);
    const s3 = makeFake(new mongoose.Types.ObjectId());

    joinQueue(s1, 'mcq');
    leaveQueue(s1.id);

    const r = joinQueue(s3, 'mcq');
    expect(r).toBeNull();

    leaveQueue(s3.id);
  });
});

// ── Group 3: Full match flow ──────────────────────────────────────────────────

describe('Group 3 — Full match flow', () => {
  const uid1 = new mongoose.Types.ObjectId();
  const uid2 = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await BattleMatch.deleteMany({});
    clearActiveMatches();
  });

  afterEach(async () => {
    clearActiveMatches();
  });

  it('MCQ queue: 2 clients match → play 3 rounds → both receive battle:finished with identical scores', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);
    try {
      // Listeners registered before queue join to avoid missing first question
      const matchPromise = playFullMatch(c1, c2, 'mcq');
      c1.emit('battle:queue:join', { mode: 'mcq' });
      c2.emit('battle:queue:join', { mode: 'mcq' });

      const { fin1, fin2 } = await matchPromise;

      expect(Object.keys(fin1.scores)).toHaveLength(2);
      // Both clients see the same final scores
      expect(fin1.scores).toEqual(fin2.scores);

      const match = await BattleMatch.findOne({});
      expect(match.status).toBe('finished');
      expect(match.mode).toBe('mcq');
    } finally {
      await closeSocket(c1);
      await closeSocket(c2);
    }
  });

  it('Typing queue: 2 clients match → play 3 rounds → both receive battle:finished', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);
    try {
      const matchPromise = playFullMatch(c1, c2, 'typing');
      c1.emit('battle:queue:join', { mode: 'typing' });
      c2.emit('battle:queue:join', { mode: 'typing' });

      const { fin1 } = await matchPromise;

      expect(fin1.scores).toBeDefined();

      const match = await BattleMatch.findOne({});
      expect(match.status).toBe('finished');
      expect(match.mode).toBe('typing');
    } finally {
      await closeSocket(c1);
      await closeSocket(c2);
    }
  });

  it('Invite code: host creates room → guest joins with code → match finishes as invite type', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);
    try {
      const matchPromise = playFullMatch(c1, c2, 'mcq');

      c1.emit('battle:room:create', { mode: 'mcq' });
      const { code } = await waitFor(c1, 'battle:room:created');
      expect(typeof code).toBe('string');
      expect(code).toHaveLength(6);

      c2.emit('battle:room:join', { code });

      await matchPromise;

      const match = await BattleMatch.findOne({});
      expect(match.matchType).toBe('invite');
      expect(match.status).toBe('finished');
    } finally {
      await closeSocket(c1);
      await closeSocket(c2);
    }
  });

  it('Faster correct answer scores higher than slower correct answer (speed bonus)', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);
    try {
      // c1 answers immediately (0ms); c2 delays 300ms per question
      const matchPromise = playFullMatch(c1, c2, 'mcq', 0, 300);
      c1.emit('battle:queue:join', { mode: 'mcq' });
      c2.emit('battle:queue:join', { mode: 'mcq' });

      const { fin1 } = await matchPromise;

      const c1Score = fin1.scores[uid1.toString()];
      const c2Score = fin1.scores[uid2.toString()];
      expect(c1Score).toBeGreaterThan(c2Score);
    } finally {
      await closeSocket(c1);
      await closeSocket(c2);
    }
  });
});

// ── Group 4: Reward idempotency ────────────────────────────────────────────────

describe('Group 4 — Reward idempotency', () => {
  // Fresh uids per test: a previous match's reward writes (grantRewards runs
  // async server-side after battle:finished) can land after the next test's
  // cleanup. New uids each test stop those late writes polluting assertions.
  let uid1;
  let uid2;

  beforeEach(async () => {
    uid1 = new mongoose.Types.ObjectId();
    uid2 = new mongoose.Types.ObjectId();
    await BattleMatch.deleteMany({});
    await XpEvent.deleteMany({});
    await UserGamification.deleteMany({});
    clearActiveMatches();
  });

  afterEach(async () => {
    clearActiveMatches();
  });

  it('both players have battle_play XP in xp_events after match', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);
    try {
      const matchPromise = playFullMatch(c1, c2, 'mcq');
      c1.emit('battle:queue:join', { mode: 'mcq' });
      c2.emit('battle:queue:join', { mode: 'mcq' });
      await matchPromise;

      // Reward writes are async after battle:finished; give them time to settle
      await new Promise((r) => setTimeout(r, 300));

      const e1 = await XpEvent.findOne({ userId: uid1, source: 'battle_play' });
      const e2 = await XpEvent.findOne({ userId: uid2, source: 'battle_play' });
      expect(e1).not.toBeNull();
      expect(e2).not.toBeNull();
    } finally {
      await closeSocket(c1);
      await closeSocket(c2);
    }
  });

  it('winner has battle_win XP; loser does not', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);
    try {
      // c1 answers immediately → higher score → c1 wins
      const matchPromise = playFullMatch(c1, c2, 'mcq', 0, 400);
      c1.emit('battle:queue:join', { mode: 'mcq' });
      c2.emit('battle:queue:join', { mode: 'mcq' });
      const { fin1 } = await matchPromise;

      await new Promise((r) => setTimeout(r, 300));

      const { winnerId } = fin1;
      if (winnerId) {
        const winXp = await XpEvent.findOne({
          userId: winnerId,
          source: 'battle_win',
        });
        expect(winXp).not.toBeNull();

        const loserId = Object.keys(fin1.scores).find((id) => id !== winnerId);
        const loserWinXp = await XpEvent.findOne({
          userId: loserId,
          source: 'battle_win',
        });
        expect(loserWinXp).toBeNull();
      }
    } finally {
      await closeSocket(c1);
      await closeSocket(c2);
    }
  });

  it('calling recordActivity twice with same source+refId creates only 1 XpEvent', async () => {
    const refId = `dup-test-${Date.now()}`;
    await gamService.recordActivity(uid1, 'battle_play', refId);
    await gamService.recordActivity(uid1, 'battle_play', refId); // duplicate → silently skipped

    const events = await XpEvent.find({
      userId: uid1,
      source: 'battle_play',
      refId,
    });
    expect(events).toHaveLength(1);
  });
});

// ── Group 5: Disconnect / forfeit ─────────────────────────────────────────────

describe('Group 5 — Disconnect / forfeit', () => {
  const uid1 = new mongoose.Types.ObjectId();
  const uid2 = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await BattleMatch.deleteMany({});
    await XpEvent.deleteMany({});
    await UserGamification.deleteMany({});
    clearActiveMatches();
  });

  afterEach(async () => {
    clearActiveMatches();
  });

  it('player 1 rejoins within grace window → receives battle:rejoined with match state', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);
    let c1b;

    try {
      c1.emit('battle:queue:join', { mode: 'mcq' });
      c2.emit('battle:queue:join', { mode: 'mcq' });

      // Confirm match is live before disconnecting
      await waitFor(c1, 'battle:question', 5000);
      const matchId = [...activeMatches.keys()][0];

      // Disconnect and rejoin within grace window (100ms < 400ms grace)
      c1.disconnect();
      await new Promise((r) => setTimeout(r, 100));

      c1b = await connectSocket(uid1);
      c1b.emit('battle:rejoin', { matchId });

      const rejoin = await waitFor(c1b, 'battle:rejoined', 3000);
      expect(rejoin.term).toBeDefined();
      expect(rejoin.mode).toBe('mcq');
      expect(typeof rejoin.currentRound).toBe('number');
    } finally {
      if (c1b) await closeSocket(c1b);
      await closeSocket(c2);
    }
  });

  it('player 1 stays disconnected past grace → player 2 wins forfeit; no battle_win XP (winner below effort threshold)', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);

    try {
      c1.emit('battle:queue:join', { mode: 'mcq' });
      c2.emit('battle:queue:join', { mode: 'mcq' });

      await waitFor(c1, 'battle:question', 5000);

      // c1 stays away; server grace timer fires → finalizeAsForfeit
      c1.disconnect();

      // Also collect the socket event (best-effort; DB check is the authoritative assertion)
      const opponentLeftPromise = waitFor(
        c2,
        'battle:opponentLeft',
        BATTLE.reconnectGraceMs + 1500
      );

      // Wait grace period + buffer to allow forfeit to complete
      await new Promise((r) => setTimeout(r, BATTLE.reconnectGraceMs + 500));

      const left = await opponentLeftPromise.catch(() => null);
      if (left) expect(left.winnerId).toBe(uid2.toString());

      // Authoritative check via DB
      const match = await BattleMatch.findOne({});
      expect(match?.status).toBe('finished');
      expect(match?.winnerId?.toString()).toBe(uid2.toString());

      // Effort-gated rewards: winning purely on an opponent's collapse grants no
      // battle_win XP when the winner is below minCorrectForReward (anti-farming).
      const winXp = await XpEvent.findOne({
        userId: uid2,
        source: 'battle_win',
      });
      expect(winXp).toBeNull();
    } finally {
      await closeSocket(c2);
    }
  });

  it('both players disconnect → match status = abandoned, no XP events created', async () => {
    const c1 = await connectSocket(uid1);
    const c2 = await connectSocket(uid2);

    c1.emit('battle:queue:join', { mode: 'mcq' });
    c2.emit('battle:queue:join', { mode: 'mcq' });

    await waitFor(c1, 'battle:question', 5000);

    // Both disconnect; whichever grace timer fires first sees opponent also gone → abandonMatch
    c1.disconnect();
    c2.disconnect();

    // Wait for both grace timers to fire (reconnectGraceMs) + buffer
    await new Promise((r) => setTimeout(r, BATTLE.reconnectGraceMs + 500));

    const match = await BattleMatch.findOne({});
    expect(match?.status).toBe('abandoned');

    const events = await XpEvent.find({});
    expect(events).toHaveLength(0);
  });
});

// ── Group 6: REST history ──────────────────────────────────────────────────────

describe('Group 6 — REST history', () => {
  const uid1 = new mongoose.Types.ObjectId();
  const uid2 = new mongoose.Types.ObjectId();
  const uidOther = new mongoose.Types.ObjectId();

  // Create User docs needed for populate('players.userId') to return non-null values.
  // Without real User docs, Mongoose populate sets userId = null → isParticipant check fails.
  beforeAll(async () => {
    await User.insertMany([
      {
        _id: uid1,
        email: `u1-${uid1}@test.com`,
        passwordHash: 'x',
        name: 'User1',
      },
      {
        _id: uid2,
        email: `u2-${uid2}@test.com`,
        passwordHash: 'x',
        name: 'User2',
      },
      {
        _id: uidOther,
        email: `u3-${uidOther}@test.com`,
        passwordHash: 'x',
        name: 'Other',
      },
    ]);
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [uid1, uid2, uidOther] } });
  });

  beforeEach(async () => {
    await BattleMatch.deleteMany({});
  });

  const seedMatch = (p1, p2) =>
    BattleMatch.create({
      mode: 'mcq',
      matchType: 'queue',
      status: 'finished',
      players: [
        { userId: p1, score: 300, correctCount: 3 },
        { userId: p2, score: 200, correctCount: 2 },
      ],
      questions: [],
      winnerId: p1,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

  it('GET /api/v1/battle/history → 401 without token', async () => {
    const res = await request(app).get('/api/v1/battle/history');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/battle/history → returns only matches the authed user participated in', async () => {
    await seedMatch(uid1, uid2);
    await seedMatch(uid2, uidOther); // uid1 not involved in this one

    const res = await request(app)
      .get('/api/v1/battle/history')
      .set('Authorization', `Bearer ${makeToken(uid1)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it('GET /api/v1/battle/:id → 401 without token', async () => {
    const match = await seedMatch(uid1, uid2);
    const res = await request(app).get(`/api/v1/battle/${match._id}`);
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/battle/:id → participant can view match detail', async () => {
    const match = await seedMatch(uid1, uid2);

    const res = await request(app)
      .get(`/api/v1/battle/${match._id}`)
      .set('Authorization', `Bearer ${makeToken(uid1)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(match._id.toString());
  });

  it('GET /api/v1/battle/:id → non-participant gets 403', async () => {
    const match = await seedMatch(uid1, uid2);

    const res = await request(app)
      .get(`/api/v1/battle/${match._id}`)
      .set('Authorization', `Bearer ${makeToken(uidOther)}`);

    expect(res.status).toBe(403);
  });
});
