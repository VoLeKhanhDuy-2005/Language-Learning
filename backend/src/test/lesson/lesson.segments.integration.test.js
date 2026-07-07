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

const makeSegment = (lessonId, startMs) =>
  LessonSegment.create({
    lessonId,
    startMs,
    endMs: startMs + 500,
    transcript: { original: `line ${startMs}`, normalized: `line ${startMs}` },
    translation: `dòng ${startMs}`,
  });

const url = (lessonId) => `/api/v1/lessons/${lessonId}/segments`;

describe('GET /api/v1/lessons/:lessonId/segments', () => {
  describe('data shape (spec: data is an array of {segment, userProgress})', () => {
    it('returns segments ordered by startMs as a flat array', async () => {
      const lesson = await makeLesson();
      await makeSegment(lesson._id, 2000);
      await makeSegment(lesson._id, 1000);

      const res = await authGet(url(lesson._id));

      expect(res.status).toBe(200);
      expect(res.body.data.map((i) => i.segment.startMs)).toEqual([1000, 2000]);
      expect(res.body.data[0]).toHaveProperty('segment');
      expect(res.body.data[0]).toHaveProperty('userProgress');
    });

    it('uses the spec message', async () => {
      const lesson = await makeLesson();
      await makeSegment(lesson._id, 1000);

      const res = await authGet(url(lesson._id));

      expect(res.body.message).toBe('Segments retrieved successfully');
    });
  });

  describe('auth + userProgress', () => {
    it('returns 401 for an anonymous request', async () => {
      const lesson = await makeLesson();
      await makeSegment(lesson._id, 1000);

      const res = await request(app).get(url(lesson._id));

      expect(res.status).toBe(401);
    });

    it("attaches the current user's segment progress when authenticated", async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id, 1000);

      await UserSegmentProgress.create({
        userId: testUserId,
        lessonId: lesson._id,
        segmentId: seg._id,
        dictation: { attemptCount: 2, bestScore: 86, hintUsedCount: 1 },
      });

      const res = await authGet(url(lesson._id));

      const up = res.body.data[0].userProgress;
      expect(up).not.toBeNull();
      expect(up.dictation.bestScore).toBe(86);
      expect(up.dictation.attemptCount).toBe(2);
    });

    it("does not attach another user's progress", async () => {
      const lesson = await makeLesson();
      const seg = await makeSegment(lesson._id, 1000);

      await UserSegmentProgress.create({
        userId: otherUserId,
        lessonId: lesson._id,
        segmentId: seg._id,
        dictation: { bestScore: 99 },
      });

      const res = await authGet(url(lesson._id));

      expect(res.body.data[0].userProgress).toBeNull();
    });

    it('returns 401 for an invalid token', async () => {
      const lesson = await makeLesson();
      await makeSegment(lesson._id, 1000);

      const res = await request(app)
        .get(url(lesson._id))
        .set('Authorization', 'Bearer not.a.valid.token');

      expect(res.status).toBe(401);
    });
  });

  describe('visibility', () => {
    it('returns 404 for a draft lesson', async () => {
      const lesson = await makeLesson({ status: 'draft' });
      await makeSegment(lesson._id, 1000);

      const res = await authGet(url(lesson._id));

      expect(res.status).toBe(404);
    });

    it('returns 404 when lesson does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const res = await authGet(url(ghostId));
      expect(res.status).toBe(404);
    });

    it('returns empty array for a published lesson with no segments', async () => {
      const lesson = await makeLesson();

      const res = await authGet(url(lesson._id));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid lessonId', async () => {
      const res = await authGet('/api/v1/lessons/notanid/segments');

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'lessonId' })])
      );
    });
  });
});
