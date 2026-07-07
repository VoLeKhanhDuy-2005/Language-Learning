import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Lesson from '../../models/lesson.model.js';
import UserLessonProgress from '../../models/userLessonProgress.model.js';
import { generateToken } from '../../utils/jwt.js';

let mongod;
const testUserId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();
const tagId = new mongoose.Types.ObjectId();
const cefrId = new mongoose.Types.ObjectId();
const validToken = generateToken(
  { id: testUserId, role: 'user', type: 'ACCESS' },
  '15m'
);

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
  await Promise.all([Lesson.deleteMany({}), UserLessonProgress.deleteMany({})]);
});

// Lesson requires sourceUrl; helper fills required fields.
const makeLesson = (over = {}) =>
  Lesson.create({
    title: over.title || 'Lesson',
    slug: over.slug || `lesson-${new mongoose.Types.ObjectId()}`,
    sourceUrl: 'https://example.com/a.mp3',
    status: 'published',
    ...over,
  });

describe('GET /api/v1/lessons', () => {
  describe('response shape', () => {
    it('returns envelope with lessons + pagination', async () => {
      await makeLesson({ title: 'A', slug: 'a' });

      const res = await request(app).get('/api/v1/lessons');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Lessons retrieved successfully',
        data: {
          lessons: expect.any(Array),
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            totalItems: expect.any(Number),
            totalPages: expect.any(Number),
          },
        },
      });
      expect(res.body.data.lessons[0]).toHaveProperty('lesson');
      expect(res.body.data.lessons[0]).toHaveProperty('userProgress');
    });

    it('defaults to page=1 limit=10', async () => {
      const res = await request(app).get('/api/v1/lessons');
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });
  });

  describe('only published lessons', () => {
    it('excludes draft and archived lessons', async () => {
      await makeLesson({ title: 'Pub', slug: 'pub', status: 'published' });
      await makeLesson({ title: 'Draft', slug: 'draft', status: 'draft' });
      await makeLesson({ title: 'Arch', slug: 'arch', status: 'archived' });

      const res = await request(app).get('/api/v1/lessons');

      expect(res.body.data.pagination.totalItems).toBe(1);
      expect(res.body.data.lessons[0].lesson.title).toBe('Pub');
    });
  });

  describe('userProgress', () => {
    it('returns null userProgress for anonymous request', async () => {
      const lesson = await makeLesson({ slug: 'x' });
      await UserLessonProgress.create({
        userId: testUserId,
        lessonId: lesson._id,
        progressPct: 50,
      });

      const res = await request(app).get('/api/v1/lessons');

      expect(res.body.data.lessons[0].userProgress).toBeNull();
    });

    it("attaches the current user's progress when authenticated", async () => {
      const lesson = await makeLesson({ slug: 'x' });
      await UserLessonProgress.create({
        userId: testUserId,
        lessonId: lesson._id,
        dictation: { status: 'in_progress', progressPct: 35, lastStartMs: 4000 },
      });

      const res = await request(app)
        .get('/api/v1/lessons')
        .set('Authorization', `Bearer ${validToken}`);

      const up = res.body.data.lessons[0].userProgress;
      expect(up).not.toBeNull();
      expect(up.dictation.progressPct).toBe(35);
      expect(up.dictation.lastStartMs).toBe(4000);
      expect(up.dictation.status).toBe('in_progress');
    });

    it("does not attach another user's progress", async () => {
      const lesson = await makeLesson({ slug: 'x' });
      await UserLessonProgress.create({
        userId: otherUserId,
        lessonId: lesson._id,
        progressPct: 99,
      });

      const res = await request(app)
        .get('/api/v1/lessons')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.lessons[0].userProgress).toBeNull();
    });

    it('treats an invalid token as anonymous (200, not 401)', async () => {
      await makeLesson({ slug: 'x' });

      const res = await request(app)
        .get('/api/v1/lessons')
        .set('Authorization', 'Bearer not.a.valid.token');

      expect(res.status).toBe(200);
      expect(res.body.data.lessons[0].userProgress).toBeNull();
    });
  });

  describe('filtering', () => {
    it('filters by tagId', async () => {
      await makeLesson({ slug: 'tagged', tagIds: [tagId] });
      await makeLesson({ slug: 'untagged' });

      const res = await request(app).get(`/api/v1/lessons?tagId=${tagId}`);

      expect(res.body.data.lessons).toHaveLength(1);
      expect(res.body.data.lessons[0].lesson.slug).toBe('tagged');
    });

    it('filters by cefrLevelId', async () => {
      await makeLesson({ slug: 'cefr', cefrLevelIds: [cefrId] });
      await makeLesson({ slug: 'no-cefr' });

      const res = await request(app).get(
        `/api/v1/lessons?cefrLevelId=${cefrId}`
      );

      expect(res.body.data.lessons).toHaveLength(1);
      expect(res.body.data.lessons[0].lesson.slug).toBe('cefr');
    });

    it('filters by mode', async () => {
      await makeLesson({ slug: 'dict', modes: ['dictation'] });
      await makeLesson({ slug: 'shadow', modes: ['shadowing'] });
      await makeLesson({ slug: 'both', modes: ['dictation', 'shadowing'] });

      const res = await request(app).get('/api/v1/lessons?mode=shadowing');

      const slugs = res.body.data.lessons.map((l) => l.lesson.slug);
      expect(slugs).toContain('shadow');
      expect(slugs).toContain('both');
      expect(slugs).not.toContain('dict');
    });

    it('searches by q (case-insensitive, title or description)', async () => {
      await makeLesson({ title: 'Travel Talk', slug: 'travel' });
      await makeLesson({
        title: 'Business',
        slug: 'biz',
        description: 'about travel abroad',
      });
      await makeLesson({ title: 'Cooking', slug: 'cook' });

      const res = await request(app).get('/api/v1/lessons?q=TRAVEL');

      const slugs = res.body.data.lessons.map((l) => l.lesson.slug);
      expect(slugs.sort()).toEqual(['biz', 'travel']);
    });

    it('treats regex metachars in q as literal (no crash, exact match)', async () => {
      await makeLesson({ title: 'C(plus)', slug: 'c' }); // title contains "("
      await makeLesson({ title: 'Plain', slug: 'plain' });

      const res = await request(app).get('/api/v1/lessons?q=%28'); // q = "("

      // Without escaping: new RegExp("(") throws -> 500.
      expect(res.status).toBe(200);
      expect(res.body.data.lessons).toHaveLength(1);
      expect(res.body.data.lessons[0].lesson.slug).toBe('c');
    });
  });

  describe('pagination', () => {
    it('paginates with page and limit', async () => {
      for (let i = 0; i < 5; i++) {
        await makeLesson({ title: `L${i}`, slug: `l-${i}` });
      }

      const res = await request(app).get('/api/v1/lessons?page=2&limit=2');

      expect(res.body.data.lessons).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        page: 2,
        limit: 2,
        totalItems: 5,
        totalPages: 3,
      });
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid tagId', async () => {
      const res = await request(app).get('/api/v1/lessons?tagId=notanid');
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'tagId' })])
      );
    });

    it('returns 400 for invalid mode enum', async () => {
      const res = await request(app).get('/api/v1/lessons?mode=singing');
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'mode' })])
      );
    });

    it('returns 400 when limit exceeds 100', async () => {
      const res = await request(app).get('/api/v1/lessons?limit=101');
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'limit' })])
      );
    });
  });
});
