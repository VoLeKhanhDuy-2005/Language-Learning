import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import UserGamification from '../../models/userGamification.model.js';
import XpEvent from '../../models/xpEvent.model.js';
import LessonSegment from '../../models/lessonSegment.model.js';
import UserSegmentProgress from '../../models/userSegmentProgress.model.js';
import UserCardState from '../../models/userCardState.model.js';
import * as userService from '../../modules/user/user.service.js';
import * as gam from '../../modules/gamification/gamification.service.js';
import { segmentXp, getDayKey, XP } from '../../config/gamification.config.js';

let mongod;
const userId = new mongoose.Types.ObjectId();

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
  await Promise.all([
    UserGamification.deleteMany({}),
    XpEvent.deleteMany({}),
    LessonSegment.deleteMany({}),
    UserSegmentProgress.deleteMany({}),
    UserCardState.deleteMany({}),
  ]);
});

// ─── segmentXp helper (pure) ─────────────────────────────────────────────────

describe('segmentXp', () => {
  it('dictation below pass -> 0', () => {
    expect(segmentXp('dictation', 59)).toBe(0);
  });
  it('dictation at pass -> 10', () => {
    expect(segmentXp('dictation', 60)).toBe(10);
  });
  it('dictation above pass -> 10', () => {
    expect(segmentXp('dictation', 100)).toBe(10);
  });
  it('shadowing at pass -> 12', () => {
    expect(segmentXp('shadowing', 55)).toBe(12);
  });
  it('shadowing below pass -> 0', () => {
    expect(segmentXp('shadowing', 54)).toBe(0);
  });
  it('unknown mode -> 0', () => {
    expect(segmentXp('battle', 100)).toBe(0);
  });
  it('non-number score -> 0', () => {
    expect(segmentXp('dictation', undefined)).toBe(0);
    expect(segmentXp('dictation', null)).toBe(0);
  });
});

// ─── recordActivity amountOverride ───────────────────────────────────────────

describe('recordActivity — amountOverride', () => {
  it('uses override amount instead of SOURCE_XP_MAP', async () => {
    await gam.recordActivity(userId, 'segment_complete', 'seg:dictation', 7);
    const profile = await UserGamification.findOne({ userId });
    // 7 (override) + 20 (first-day streak bonus)
    expect(profile.totalXp).toBe(7 + XP.dailyStreakBonus);
    const ev = await XpEvent.findOne({ userId, refId: 'seg:dictation' });
    expect(ev.amount).toBe(7);
  });

  it('amount <= 0 -> no event, no profile, no streak', async () => {
    await gam.recordActivity(userId, 'segment_complete', 'seg:dictation', 0);
    expect(await XpEvent.countDocuments({ userId })).toBe(0);
    expect(await UserGamification.findOne({ userId })).toBeNull();
  });
});

// ─── updateSegmentProgress — dictation XP ────────────────────────────────────

describe('updateSegmentProgress — dictation XP', () => {
  const lessonId = new mongoose.Types.ObjectId();
  let segmentId;

  beforeEach(async () => {
    // normalized = 5 từ -> hintPenalty = (hints/5)*100
    const seg = await LessonSegment.create({
      lessonId,
      startMs: 0,
      endMs: 1000,
      transcript: {
        original: 'the quick brown fox jumps',
        normalized: 'the quick brown fox jumps',
      },
      translation: 'x',
    });
    segmentId = seg._id;
  });

  it('pass (no hint) -> +10 XP + streak bonus, refId <seg>:dictation', async () => {
    await userService.updateSegmentProgress(userId, lessonId, segmentId, {
      dictation: { attemptCount: 1, hintUsedCount: 0 },
    });
    const profile = await UserGamification.findOne({ userId });
    expect(profile.totalXp).toBe(10 + XP.dailyStreakBonus);
    const ev = await XpEvent.findOne({
      userId,
      source: 'segment_complete',
      refId: `${segmentId}:dictation`,
    });
    expect(ev).not.toBeNull();
    expect(ev.amount).toBe(10);
  });

  it('below pass (reveal 3/5 -> score 40) -> 0 XP, no event', async () => {
    await userService.updateSegmentProgress(userId, lessonId, segmentId, {
      dictation: { attemptCount: 1, hintUsedCount: 3 },
    });
    expect(
      await XpEvent.countDocuments({ userId, source: 'segment_complete' })
    ).toBe(0);
    expect(await UserGamification.findOne({ userId })).toBeNull();
  });

  it('idempotent — two passes on same segment award dictation XP once', async () => {
    await userService.updateSegmentProgress(userId, lessonId, segmentId, {
      dictation: { attemptCount: 1, hintUsedCount: 0 },
    });
    await userService.updateSegmentProgress(userId, lessonId, segmentId, {
      dictation: { attemptCount: 1, hintUsedCount: 0 },
    });
    expect(
      await XpEvent.countDocuments({
        userId,
        source: 'segment_complete',
        refId: `${segmentId}:dictation`,
      })
    ).toBe(1);
    const profile = await UserGamification.findOne({ userId });
    expect(profile.totalXp).toBe(10 + XP.dailyStreakBonus);
  });
});

// ─── upsertCardState — card_review XP ────────────────────────────────────────

describe('upsertCardState — card_review XP', () => {
  const cardId = new mongoose.Types.ObjectId();
  const deckId = new mongoose.Types.ObjectId();
  const topicId = new mongoose.Types.ObjectId();

  it('graded -> +3 XP + streak bonus, refId <card>:<dayKey>', async () => {
    await userService.upsertCardState(userId, cardId, {
      deckId,
      topicId,
      srs: { lastGrade: 2 },
    });
    const profile = await UserGamification.findOne({ userId });
    expect(profile.totalXp).toBe(XP.cardReview + XP.dailyStreakBonus);
    const ev = await XpEvent.findOne({
      userId,
      source: 'card_review',
      refId: `${cardId}:${getDayKey()}`,
    });
    expect(ev).not.toBeNull();
  });

  it('star/hide-only update (no grade) -> no card_review XP', async () => {
    await userService.upsertCardState(userId, cardId, {
      deckId,
      topicId,
      flags: { starred: true },
    });
    expect(
      await XpEvent.countDocuments({ userId, source: 'card_review' })
    ).toBe(0);
  });

  it('same card graded twice same day -> XP once', async () => {
    await userService.upsertCardState(userId, cardId, {
      deckId,
      topicId,
      srs: { lastGrade: 2 },
    });
    await userService.upsertCardState(userId, cardId, {
      srs: { lastGrade: 3 },
    });
    expect(
      await XpEvent.countDocuments({ userId, source: 'card_review' })
    ).toBe(1);
  });
});
