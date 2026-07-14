import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/user.model.js';
import UserSegmentProgress from '../../models/userSegmentProgress.model.js';
import Lesson from '../../models/lesson.model.js';
import LessonSegment from '../../models/lessonSegment.model.js';
import { generateToken } from '../../utils/jwt.js';

let mongod;
let testUser;
let token;
let lessonId;

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
  await UserSegmentProgress.deleteMany({});
  await Lesson.deleteMany({});
  await LessonSegment.deleteMany({});

  testUser = await User.create({
    name: 'Lesson User',
    email: 'lesson@example.com',
    passwordHash: 'dummyhash',
    isVerified: true,
  });
  token = generateToken(
    { id: testUser._id, role: 'user', type: 'ACCESS' },
    '1h'
  );

  const lesson = await Lesson.create({
    title: 'Test Lesson',
    description: 'Test Lesson Desc',
    youtubeId: 'abc123xyz',
    sourceUrl: 'http://youtube.com/watch?v=abc123xyz',
    slug: 'test-lesson',
    level: 'A1',
    tags: [],
    thumbnailUrl: 'http://example.com/thumb.jpg',
  });
  lessonId = lesson._id;
});

describe('Lesson Progress Integration', () => {
  describe('GET /users/me/lessons/:lessonId/segments-progress', () => {
    it('returns a list of segment progresses for a lesson', async () => {
      const segmentId1 = new mongoose.Types.ObjectId();
      const segmentId2 = new mongoose.Types.ObjectId();

      await UserSegmentProgress.create({
        userId: testUser._id,
        lessonId,
        segmentId: segmentId1,
        dictation: { attemptCount: 1, bestScore: 100 },
      });

      await UserSegmentProgress.create({
        userId: testUser._id,
        lessonId,
        segmentId: segmentId2,
        shadowing: { attemptCount: 2, bestScore: 50 },
      });

      const res = await request(app)
        .get(
          `/api/v1/users/me/lessons/${lessonId.toString()}/segments-progress`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].lessonId).toBe(lessonId.toString());
    });
  });

  describe('GET /users/me/lessons/:lessonId/segments/:segmentId/progress', () => {
    it('returns progress for a specific segment', async () => {
      const segmentId = new mongoose.Types.ObjectId();

      await UserSegmentProgress.create({
        userId: testUser._id,
        lessonId,
        segmentId,
        dictation: { attemptCount: 1, bestScore: 80 },
      });

      const res = await request(app)
        .get(
          `/api/v1/users/me/lessons/${lessonId.toString()}/segments/${segmentId.toString()}/progress`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.dictation.bestScore).toBe(80);
    });

    it('returns 404 if progress does not exist', async () => {
      const segmentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(
          `/api/v1/users/me/lessons/${lessonId.toString()}/segments/${segmentId.toString()}/progress`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SEGMENT_PROGRESS_NOT_FOUND');
    });
  });

  describe('PATCH /users/me/lessons/:lessonId/segments/:segmentId/progress', () => {
    it('creates new progress if it does not exist', async () => {
      const segment = await LessonSegment.create({
        lessonId,
        transcript: {
          original: 'hello world',
          normalized: 'hello world',
          segments: [],
        },
        translation: 'chao the gioi',
        startMs: 0,
        endMs: 1000,
        vocabulary: [],
      });
      const segmentId = segment._id;

      const payload = {
        dictation: {
          attemptCount: 1,
          hintUsedCount: 0,
        },
      };

      const res = await request(app)
        .patch(
          `/api/v1/users/me/lessons/${lessonId.toString()}/segments/${segmentId.toString()}/progress`
        )
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.data.dictation.bestScore).toBe(100);

      const dbProgress = await UserSegmentProgress.findOne({
        userId: testUser._id,
        lessonId,
        segmentId,
      });
      expect(dbProgress).not.toBeNull();
      expect(dbProgress.dictation.attemptCount).toBe(1);
    });

    it('updates existing progress with new attempts', async () => {
      const segment = await LessonSegment.create({
        lessonId,
        transcript: {
          original: 'hello world',
          normalized: 'hello world',
          segments: [],
        },
        translation: 'chao the gioi',
        startMs: 0,
        endMs: 1000,
        vocabulary: [],
      });
      const segmentId = segment._id;

      await UserSegmentProgress.create({
        userId: testUser._id,
        lessonId,
        segmentId,
        dictation: { attemptCount: 1, bestScore: 90 },
      });

      const payload = {
        dictation: {
          attemptCount: 2,
          hintUsedCount: 1,
        },
      };

      const res = await request(app)
        .patch(
          `/api/v1/users/me/lessons/${lessonId.toString()}/segments/${segmentId.toString()}/progress`
        )
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(200);
      // bestScore should remain 90 since new attempt scored lower (50 penalty + 5 penalty) = 45
      expect(res.body.data.dictation.bestScore).toBe(90);
    });

    it('updates existing progress with new high score', async () => {
      const segment = await LessonSegment.create({
        lessonId,
        transcript: {
          original: 'hello world',
          normalized: 'hello world',
          segments: [],
        },
        translation: 'chao the gioi',
        startMs: 0,
        endMs: 1000,
        vocabulary: [],
      });
      const segmentId = segment._id;

      await UserSegmentProgress.create({
        userId: testUser._id,
        lessonId,
        segmentId,
        dictation: { attemptCount: 2, bestScore: 50 },
      });

      const payload = {
        dictation: {
          attemptCount: 1, // pretend a new try with 0 penalty
          hintUsedCount: 0,
        },
      };

      const res = await request(app)
        .patch(
          `/api/v1/users/me/lessons/${lessonId.toString()}/segments/${segmentId.toString()}/progress`
        )
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.data.dictation.bestScore).toBe(100);
    });
  });
});
