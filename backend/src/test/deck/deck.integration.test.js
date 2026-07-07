import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Deck from '../../models/deck.model.js';
import { generateToken } from '../../utils/jwt.js';

let mongod;
const tagId = new mongoose.Types.ObjectId();
const cefrId = new mongoose.Types.ObjectId();
const testUserId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();

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
  await Deck.deleteMany({});
});

const makeToken = (userId) =>
  generateToken({ id: userId, role: 'user', type: 'ACCESS' }, '15m');

describe('GET /api/v1/decks', () => {
  describe('response shape', () => {
    it('returns correct envelope and pagination fields', async () => {
      await Deck.insertMany([
        {
          title: 'System Deck',
          slug: 'system-deck',
          ownerType: 'system',
          status: 'published',
        },
      ]);

      const res = await request(app).get('/api/v1/decks');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Decks retrieved successfully',
        data: {
          decks: expect.any(Array),
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            totalItems: expect.any(Number),
            totalPages: expect.any(Number),
          },
        },
      });
    });

    it('defaults to page=1 limit=10', async () => {
      const res = await request(app).get('/api/v1/decks');

      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });
  });

  describe('anonymous access', () => {
    it('returns only system published decks', async () => {
      await Deck.insertMany([
        {
          title: 'Published A',
          slug: 'published-a',
          ownerType: 'system',
          status: 'published',
        },
        {
          title: 'Published B',
          slug: 'published-b',
          ownerType: 'system',
          status: 'published',
        },
        {
          title: 'Draft System',
          slug: 'draft-system',
          ownerType: 'system',
          status: 'draft',
        },
        {
          title: 'Archived System',
          slug: 'archived-system',
          ownerType: 'system',
          status: 'archived',
        },
        {
          title: 'User Deck',
          slug: 'user-deck',
          ownerType: 'user',
          ownerId: testUserId,
          status: 'published',
        },
      ]);

      const res = await request(app).get('/api/v1/decks');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(2);
      expect(res.body.data.pagination.totalItems).toBe(2);

      const titles = res.body.data.decks.map((d) => d.title);
      expect(titles).toContain('Published A');
      expect(titles).toContain('Published B');
      expect(titles).not.toContain('Draft System');
      expect(titles).not.toContain('Archived System');
      expect(titles).not.toContain('User Deck');
    });

    it('returns empty array when no system published decks exist', async () => {
      await Deck.insertMany([
        {
          title: 'Draft Only',
          slug: 'draft-only',
          ownerType: 'system',
          status: 'draft',
        },
      ]);

      const res = await request(app).get('/api/v1/decks');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(0);
      expect(res.body.data.pagination.totalItems).toBe(0);
    });
  });

  describe('authenticated access', () => {
    it('still returns only system published decks (user decks excluded)', async () => {
      await Deck.insertMany([
        {
          title: 'System Deck',
          slug: 'system-deck',
          ownerType: 'system',
          status: 'published',
        },
        {
          title: 'My Published',
          slug: 'my-published',
          ownerType: 'user',
          ownerId: testUserId,
          status: 'published',
        },
        {
          title: 'My Draft',
          slug: 'my-draft',
          ownerType: 'user',
          ownerId: testUserId,
          status: 'draft',
        },
        {
          title: 'Other User',
          slug: 'other-user',
          ownerType: 'user',
          ownerId: otherUserId,
          status: 'published',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/decks')
        .set('Authorization', `Bearer ${makeToken(testUserId)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.totalItems).toBe(1);

      const titles = res.body.data.decks.map((d) => d.title);
      expect(titles).toContain('System Deck');
      expect(titles).not.toContain('My Published');
      expect(titles).not.toContain('My Draft');
      expect(titles).not.toContain('Other User');
    });
  });

  describe('optional auth degradation', () => {
    it('treats an invalid Bearer token as anonymous (200, not 401)', async () => {
      await Deck.insertMany([
        {
          title: 'System Deck',
          slug: 'system-deck',
          ownerType: 'system',
          status: 'published',
        },
        {
          title: 'User Deck',
          slug: 'user-deck',
          ownerType: 'user',
          ownerId: testUserId,
          status: 'published',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/decks')
        .set('Authorization', 'Bearer not.a.valid.token');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.decks[0].title).toBe('System Deck');
    });

    it('treats an expired Bearer token as anonymous', async () => {
      await Deck.insertMany([
        {
          title: 'System Deck',
          slug: 'system-deck',
          ownerType: 'system',
          status: 'published',
        },
      ]);

      const expiredToken = generateToken(
        { id: testUserId, role: 'user', type: 'ACCESS' },
        '0s'
      );

      const res = await request(app)
        .get('/api/v1/decks')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
    });
  });

  describe('filtering', () => {
    it('filters by tagId', async () => {
      await Deck.insertMany([
        {
          title: 'Tagged Deck',
          slug: 'tagged',
          ownerType: 'system',
          status: 'published',
          tagIds: [tagId],
        },
        {
          title: 'Untagged Deck',
          slug: 'untagged',
          ownerType: 'system',
          status: 'published',
          tagIds: [],
        },
      ]);

      const res = await request(app).get(`/api/v1/decks?tagId=${tagId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.decks[0].title).toBe('Tagged Deck');
    });

    it('filters by cefrLevelId', async () => {
      await Deck.insertMany([
        {
          title: 'CEFR Deck',
          slug: 'cefr-deck',
          ownerType: 'system',
          status: 'published',
          cefrLevelIds: [cefrId],
        },
        {
          title: 'No Level Deck',
          slug: 'no-level',
          ownerType: 'system',
          status: 'published',
          cefrLevelIds: [],
        },
      ]);

      const res = await request(app).get(`/api/v1/decks?cefrLevelId=${cefrId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.decks[0].title).toBe('CEFR Deck');
    });

    it('searches title by q (case-insensitive)', async () => {
      await Deck.insertMany([
        {
          title: 'Travel Vocabulary',
          slug: 'travel-vocab',
          ownerType: 'system',
          status: 'published',
        },
        {
          title: 'Business English',
          slug: 'business-english',
          ownerType: 'system',
          status: 'published',
        },
      ]);

      const res = await request(app).get('/api/v1/decks?q=TRAVEL');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.decks[0].title).toBe('Travel Vocabulary');
    });

    it('searches description by q', async () => {
      await Deck.insertMany([
        {
          title: 'Deck A',
          slug: 'deck-a',
          description: 'common travel phrases',
          ownerType: 'system',
          status: 'published',
        },
        {
          title: 'Deck B',
          slug: 'deck-b',
          description: 'business terminology',
          ownerType: 'system',
          status: 'published',
        },
      ]);

      const res = await request(app).get('/api/v1/decks?q=business');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.decks[0].title).toBe('Deck B');
    });

    it('returns empty array when no deck matches q', async () => {
      await Deck.insertMany([
        {
          title: 'Travel Deck',
          slug: 'travel-deck',
          ownerType: 'system',
          status: 'published',
        },
      ]);

      const res = await request(app).get('/api/v1/decks?q=xyznonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(0);
      expect(res.body.data.pagination.totalItems).toBe(0);
    });

    it('can combine tagId and cefrLevelId filters', async () => {
      await Deck.insertMany([
        {
          title: 'Both',
          slug: 'both',
          ownerType: 'system',
          status: 'published',
          tagIds: [tagId],
          cefrLevelIds: [cefrId],
        },
        {
          title: 'Tag only',
          slug: 'tag-only',
          ownerType: 'system',
          status: 'published',
          tagIds: [tagId],
          cefrLevelIds: [],
        },
        {
          title: 'Neither',
          slug: 'neither',
          ownerType: 'system',
          status: 'published',
          tagIds: [],
          cefrLevelIds: [],
        },
      ]);

      const res = await request(app).get(
        `/api/v1/decks?tagId=${tagId}&cefrLevelId=${cefrId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.decks[0].title).toBe('Both');
    });
  });

  describe('pagination', () => {
    it('paginates correctly with page and limit', async () => {
      const decks = Array.from({ length: 5 }, (_, i) => ({
        title: `Deck ${i + 1}`,
        slug: `deck-${i + 1}`,
        ownerType: 'system',
        status: 'published',
      }));
      await Deck.insertMany(decks);

      const res = await request(app).get('/api/v1/decks?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        page: 2,
        limit: 2,
        totalItems: 5,
        totalPages: 3,
      });
    });

    it('last page may have fewer items than limit', async () => {
      const decks = Array.from({ length: 3 }, (_, i) => ({
        title: `Deck ${i + 1}`,
        slug: `deck-${i + 1}`,
        ownerType: 'system',
        status: 'published',
      }));
      await Deck.insertMany(decks);

      const res = await request(app).get('/api/v1/decks?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('input validation', () => {
    it('returns 400 when tagId is not a valid ObjectId', async () => {
      const res = await request(app).get('/api/v1/decks?tagId=notanobjectid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'tagId' })])
      );
    });

    it('returns 400 when cefrLevelId is not a valid ObjectId', async () => {
      const res = await request(app).get('/api/v1/decks?cefrLevelId=invalid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'cefrLevelId' }),
        ])
      );
    });

    it('returns 400 when page is less than 1', async () => {
      const res = await request(app).get('/api/v1/decks?page=0');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'page' })])
      );
    });

    it('returns 400 when limit exceeds 100', async () => {
      const res = await request(app).get('/api/v1/decks?limit=101');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'limit' })])
      );
    });
  });
});
