import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import UserGamification from '../../models/userGamification.model.js';
import User from '../../models/user.model.js';
import XpEvent from '../../models/xpEvent.model.js';
import { generateToken } from '../../utils/jwt.js';
import { XP, getDayKey } from '../../config/gamification.config.js';
import * as service from '../../modules/gamification/gamification.service.js';

let mongod;
const userId1 = new mongoose.Types.ObjectId();
const userId2 = new mongoose.Types.ObjectId();
const userId3 = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await UserGamification.createIndexes();
  await XpEvent.createIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await UserGamification.deleteMany({});
  await XpEvent.deleteMany({});
  await User.deleteMany({});
  const usersToCreate = [userId1, userId2, userId3].map(id => ({
    _id: id,
    email: `test_${Date.now()}_${Math.floor(Math.random()*10000)}@test.com`,
    passwordHash: 'hash',
    name: 'Test',
    isActive: true,
    role: 'user'
  }));
  await User.insertMany(usersToCreate);
});

const makeToken = (userId) =>
  generateToken({ id: userId, role: 'user', type: 'ACCESS' }, '15m');

// ─── recordActivity (service-level) ──────────────────────────────────────────

describe('recordActivity — idempotency', () => {
  it('awards XP only once for same source+refId on same day', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');

    const profile = await UserGamification.findOne({ userId: userId1 });
    // segmentComplete XP + dailyStreakBonus (first day)
    expect(profile.totalXp).toBe(XP.segmentComplete + XP.dailyStreakBonus);
  });

  it('awards XP for each distinct refId', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');
    await service.recordActivity(userId1, 'segment_complete', 'seg-2');

    const profile = await UserGamification.findOne({ userId: userId1 });
    // 2x segmentComplete + 1x streak bonus (same day)
    expect(profile.totalXp).toBe(XP.segmentComplete * 2 + XP.dailyStreakBonus);
  });
});

describe('recordActivity — streak transitions', () => {
  it('first ever activity creates profile with streak=1', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');

    const profile = await UserGamification.findOne({ userId: userId1 });
    expect(profile.currentStreak).toBe(1);
    expect(profile.longestStreak).toBe(1);
    expect(profile.lastActiveDayKey).toBe(getDayKey());
  });

  it('same day second action does not increment streak', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');
    await service.recordActivity(
      userId1,
      'card_review',
      'card-1:' + getDayKey()
    );

    const profile = await UserGamification.findOne({ userId: userId1 });
    expect(profile.currentStreak).toBe(1);
  });

  it('consecutive day increments streak', async () => {
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return getDayKey(d);
    })();

    // Seed yesterday's activity directly in the model
    await UserGamification.create({
      userId: userId1,
      currentStreak: 3,
      longestStreak: 3,
      lastActiveDayKey: yesterday,
      totalXp: 100,
    });
    await XpEvent.create({
      userId: userId1,
      source: 'daily_streak',
      refId: yesterday,
      amount: XP.dailyStreakBonus,
    });

    await service.recordActivity(userId1, 'segment_complete', 'seg-today');

    const profile = await UserGamification.findOne({ userId: userId1 });
    expect(profile.currentStreak).toBe(4);
    expect(profile.longestStreak).toBe(4);
  });

  it('gap day resets streak to 1', async () => {
    const twoDaysAgo = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return getDayKey(d);
    })();

    await UserGamification.create({
      userId: userId1,
      currentStreak: 5,
      longestStreak: 5,
      lastActiveDayKey: twoDaysAgo,
      totalXp: 200,
    });

    await service.recordActivity(userId1, 'segment_complete', 'seg-today');

    const profile = await UserGamification.findOne({ userId: userId1 });
    expect(profile.currentStreak).toBe(1);
    expect(profile.longestStreak).toBe(5); // longest preserved
  });
});

describe('recordActivity — daily streak bonus', () => {
  it('awards streak bonus on first activity of each new day', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');

    const profile = await UserGamification.findOne({ userId: userId1 });
    expect(profile.totalXp).toBe(XP.segmentComplete + XP.dailyStreakBonus);

    const bonusEvent = await XpEvent.findOne({
      userId: userId1,
      source: 'daily_streak',
      refId: getDayKey(),
    });
    expect(bonusEvent).not.toBeNull();
  });

  it('awards streak bonus only once per day (same-day second action)', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');
    await service.recordActivity(
      userId1,
      'card_review',
      'card-1:' + getDayKey()
    );

    const bonusEvents = await XpEvent.find({
      userId: userId1,
      source: 'daily_streak',
    });
    expect(bonusEvents).toHaveLength(1);
  });

  it('two activities same day different source: both XP awarded, streak bonus once', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-1');
    await service.recordActivity(
      userId1,
      'card_review',
      'card-1:' + getDayKey()
    );

    const profile = await UserGamification.findOne({ userId: userId1 });
    expect(profile.totalXp).toBe(
      XP.segmentComplete + XP.cardReview + XP.dailyStreakBonus
    );
  });
});

describe('recordActivity — level computation', () => {
  it('level updates when XP crosses threshold', async () => {
    // Level 2 requires requiredXpForLevel(1) = 100 XP
    // Each segment_complete = 10 XP + 20 streak bonus = 30 on first activity
    // Seed a profile near threshold
    await UserGamification.create({
      userId: userId1,
      totalXp: 89,
      level: 1,
      lastActiveDayKey: null,
    });

    // +10 XP segment + 20 streak bonus = 119 total → level 2
    await service.recordActivity(userId1, 'segment_complete', 'seg-cross');

    const profile = await UserGamification.findOne({ userId: userId1 });
    expect(profile.totalXp).toBe(89 + XP.segmentComplete + XP.dailyStreakBonus);
    expect(profile.level).toBe(2);
  });
});

// ─── GET /api/v1/gamification/streak ─────────────────────────────────────────

describe('GET /api/v1/gamification/streak', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/gamification/streak');
    expect(res.status).toBe(401);
  });

  it('returns currentStreak=0 and activeToday=false for new user', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/streak')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDayKey: null,
      activeToday: false,
    });
  });

  it('returns activeToday=true after a real learning action', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-http-test');

    const res = await request(app)
      .get('/api/v1/gamification/streak')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currentStreak).toBeGreaterThanOrEqual(1);
    expect(res.body.data.activeToday).toBe(true);
  });

  it('returns activeToday=false after streak from a previous day', async () => {
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return getDayKey(d);
    })();

    await UserGamification.create({
      userId: userId1,
      currentStreak: 2,
      longestStreak: 2,
      lastActiveDayKey: yesterday,
      totalXp: 50,
    });

    const res = await request(app)
      .get('/api/v1/gamification/streak')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.activeToday).toBe(false);
    expect(res.body.data.currentStreak).toBe(2);
  });

  it('streak does not change from calling GET streak alone', async () => {
    // Call GET streak multiple times without any learning action
    await request(app)
      .get('/api/v1/gamification/streak')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);
    await request(app)
      .get('/api/v1/gamification/streak')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    const profile = await UserGamification.findOne({ userId: userId1 });
    // ensureProfile creates a doc, but streak stays 0
    expect(profile.currentStreak).toBe(0);
    expect(profile.lastActiveDayKey).toBeNull();
  });
});

// ─── GET /api/v1/gamification/me ─────────────────────────────────────────────

describe('GET /api/v1/gamification/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/gamification/me');
    expect(res.status).toBe(401);
  });

  it('returns defaults (xp=0, level=1, progressPct=0) for new user', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/me')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      xpIntoLevel: 0,
      xpForNextLevel: 100, // requiredXpForLevel(1) - requiredXpForLevel(0) = 100 - 0
      progressPct: 0,
    });
  });

  it('returns correct level and progress fields for known XP', async () => {
    // totalXp=50: level 1 halfway (xpFloor=0, xpCeil=100)
    await UserGamification.create({
      userId: userId1,
      totalXp: 50,
      level: 1,
    });

    const res = await request(app)
      .get('/api/v1/gamification/me')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalXp: 50,
      level: 1,
      xpIntoLevel: 50,
      xpForNextLevel: 100,
      progressPct: 50,
    });
  });

  it('computes level 2 correctly when XP crosses threshold', async () => {
    // requiredXpForLevel(1)=100 -> level 2 starts at 100
    // level 2 span: requiredXpForLevel(2)-requiredXpForLevel(1) = 300-100 = 200
    await UserGamification.create({
      userId: userId1,
      totalXp: 200,
      level: 2,
    });

    const res = await request(app)
      .get('/api/v1/gamification/me')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalXp: 200,
      level: 2,
      xpIntoLevel: 100, // 200 - 100
      xpForNextLevel: 200, // 300 - 100
      progressPct: 50,
    });
  });

  it('progressPct is in [0, 100]', async () => {
    await service.recordActivity(userId1, 'segment_complete', 'seg-me-test');

    const res = await request(app)
      .get('/api/v1/gamification/me')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    const { progressPct } = res.body.data;
    expect(progressPct).toBeGreaterThanOrEqual(0);
    expect(progressPct).toBeLessThanOrEqual(100);
  });
});

// ─── GET /api/v1/gamification/leaderboard ────────────────────────────────────

describe('GET /api/v1/gamification/leaderboard', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/gamification/leaderboard');
    expect(res.status).toBe(401);
  });

  it('returns empty board when no users', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/leaderboard')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });

  it('orders users by totalXp descending', async () => {

    await UserGamification.insertMany([
      { userId: userId1, totalXp: 100, level: 2 },
      { userId: userId2, totalXp: 300, level: 3 },
      { userId: userId3, totalXp: 50, level: 1 },
    ]);

    const res = await request(app)
      .get('/api/v1/gamification/leaderboard')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    const items = res.body.data.items;
    expect(items).toHaveLength(3);
    expect(items[0].totalXp).toBe(300);
    expect(items[1].totalXp).toBe(100);
    expect(items[2].totalXp).toBe(50);
    expect(items[0].rank).toBe(1);
    expect(items[1].rank).toBe(2);
    expect(items[2].rank).toBe(3);
  });

  it('rank numbers correct across pages', async () => {

    await UserGamification.insertMany([
      { userId: userId1, totalXp: 300, level: 3 },
      { userId: userId2, totalXp: 200, level: 2 },
      { userId: userId3, totalXp: 100, level: 1 },
    ]);

    const page2 = await request(app)
      .get('/api/v1/gamification/leaderboard?page=2&limit=2')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(page2.status).toBe(200);
    const items = page2.body.data.items;
    expect(items).toHaveLength(1);
    expect(items[0].rank).toBe(3);
    expect(page2.body.data.total).toBe(3);
    expect(page2.body.data.page).toBe(2);
    expect(page2.body.data.limit).toBe(2);
  });

  it('returns 400 for limit > 100', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/leaderboard?limit=200')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(400);
  });

  it('returns 400 for page=0', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/leaderboard?page=0')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(400);
  });

  it('uses default page=1 limit=20 when not provided', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/leaderboard')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(20);
  });
});

// ─── GET /api/v1/gamification/me/rank ────────────────────────────────────────

describe('GET /api/v1/gamification/me/rank', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/gamification/me/rank');
    expect(res.status).toBe(401);
  });

  it('returns rank=totalPlayers for new user with xp=0', async () => {

    await UserGamification.insertMany([
      { userId: userId1, totalXp: 300, level: 3 },
      { userId: userId2, totalXp: 200, level: 2 },
      { userId: userId3, totalXp: 0, level: 1 },
    ]);

    const res = await request(app)
      .get('/api/v1/gamification/me/rank')
      .set('Authorization', `Bearer ${makeToken(userId3)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      rank: 3,
      totalXp: 0,
      totalPlayers: 3,
    });
  });

  it('returns rank=1 for top user', async () => {
    await UserGamification.insertMany([
      { userId: userId1, totalXp: 500, level: 4 },
      { userId: userId2, totalXp: 200, level: 2 },
    ]);

    const res = await request(app)
      .get('/api/v1/gamification/me/rank')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      rank: 1,
      totalXp: 500,
      totalPlayers: 2,
    });
  });

  it('returns correct rank for middle user', async () => {

    await UserGamification.insertMany([
      { userId: userId1, totalXp: 500, level: 4 },
      { userId: userId2, totalXp: 300, level: 3 },
      { userId: userId3, totalXp: 100, level: 1 },
    ]);

    const res = await request(app)
      .get('/api/v1/gamification/me/rank')
      .set('Authorization', `Bearer ${makeToken(userId2)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      rank: 2,
      totalXp: 300,
      totalPlayers: 3,
    });
  });

  it('creates profile on first call (no prior activity)', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/me/rank')
      .set('Authorization', `Bearer ${makeToken(userId1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalXp).toBe(0);
    expect(res.body.data.rank).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalPlayers).toBeGreaterThanOrEqual(1);
  });
});
