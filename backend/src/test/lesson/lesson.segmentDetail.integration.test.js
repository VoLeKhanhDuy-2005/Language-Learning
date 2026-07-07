import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Lesson from '../../models/lesson.model.js';
import LessonSegment from '../../models/lessonSegment.model.js';
import UserSegmentProgress from '../../models/userSegmentProgress.model.js';
import { generateToken } from '../../utils/jwt.js';

let mongod;
const testUserId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();
const validToken = generateToken(
  { id: testUserId, role: 'user', type: 'ACCESS' },
  '15m'
);

const authGet = (u) =>
  request(app).get(u).set('Authorization', `Bearer ${validToken}`);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await User.create({ 
    _id: testUserId, 
    email: `test_${Date.now()}_${Math.floor(Math.random()*1000)}@test.com`, 
    passwordHash: 'hash', 
    name: 'Test User', 
    isActive: true, 
    role: 'user' 
  });
  await Promise.all([
    Lesson.deleteMany({}),
    LessonSegment.deleteMany({}),
    UserSegmentProgress.deleteMany({}),
  ]);
});

const makeLesson = (over = {}) =>
  Lesson.create({
    title: over.title || 'Lesson',
    slug: over.slug || `lesson-${new mongoose.Types.ObjectId()}`,
    sourceUrl: 'https://example.com/a.mp3',
    status: 'published',
    ...over,
  });

const makeSegment = (lessonId, startMs = 1000) =>
  LessonSegment.create({
    lessonId,
    startMs,
    endMs: startMs + 500,
    transcript: { original: 'hello', normalized: 'hello' },
    translation: 'xin chào',
  });

const url = (lessonId, segmentId) =>
  `/api/v1/lessons/${lessonId}/segments/${segmentId}`;

describe('GET /api/v1/lessons/:lessonId/segments/:segmentId', () => {
  describe('auth + userProgress', () => {
    it('returns 401 without a token', async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id);

      const res = await request(app).get(url(lesson._id, seg._id));

      expect(res.status).toBe(401);
    });

    it('returns the segment with userProgress null when no progress', async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id);

      const res = await authGet(url(lesson._id, seg._id));

      expect(res.status).toBe(200);
      expect(res.body.data.segment._id).toBe(seg._id.toString());
      expect(res.body.data.userProgress).toBeNull();
    });

    it("attaches the current user's segment progress when authenticated", async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id);
      await UserSegmentProgress.create({
        userId: testUserId,
        lessonId: lesson._id,
        segmentId: seg._id,
        shadowing: { attemptCount: 1, bestScore: 78, completed: false },
      });

      const res = await authGet(url(lesson._id, seg._id));

      const up = res.body.data.userProgress;
      expect(up).not.toBeNull();
      expect(up.shadowing.bestScore).toBe(78);
    });

    it("does not attach another user's progress", async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id);
      await UserSegmentProgress.create({
        userId: otherUserId,
        lessonId: lesson._id,
        segmentId: seg._id,
        dictation: { bestScore: 99 },
      });

      const res = await authGet(url(lesson._id, seg._id));

      expect(res.body.data.userProgress).toBeNull();
    });

    it('returns 401 for an invalid token', async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id);

      const res = await request(app)
        .get(url(lesson._id, seg._id))
        .set('Authorization', 'Bearer not.a.valid.token');

      expect(res.status).toBe(401);
    });
  });

  describe('visibility + not found', () => {
    it('returns 404 when the segment does not exist', async () => {
      const lesson = await makeLesson();
      const ghost = new mongoose.Types.ObjectId();

      const res = await authGet(url(lesson._id, ghost));

      expect(res.status).toBe(404);
    });

    it('returns 404 when the segment belongs to a different lesson', async () => {
      const lesson = await makeLesson({ slug: 'a' });
      const otherLesson = await makeLesson({ slug: 'b' });
      const seg = await makeSegment(otherLesson._id);

      const res = await authGet(url(lesson._id, seg._id));

      expect(res.status).toBe(404);
    });

    it('returns 404 when the lesson is not published', async () => {
      const lesson = await makeLesson({ status: 'draft' });
      const seg = await makeSegment(lesson._id);

      const res = await authGet(url(lesson._id, seg._id));

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid segmentId', async () => {
      const lesson = await makeLesson();
      const res = await authGet(
        `/api/v1/lessons/${lesson._id}/segments/notanid`
      );

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'segmentId' }),
        ])
      );
    });
  });

  describe('response shape', () => {
    it('returns correct envelope with segment + userProgress', async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id, 3000);

      const res = await authGet(url(lesson._id, seg._id));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Segment detail retrieved successfully',
        data: {
          segment: { startMs: 3000 },
        },
      });
      expect(res.body.data).toHaveProperty('userProgress');
    });
  });
});
