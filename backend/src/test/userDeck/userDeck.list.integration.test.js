import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Deck from '../../models/deck.model.js';
import { generateToken } from '../../utils/jwt.js';

let mongod;
const testUserId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();
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
  await Deck.deleteMany({});
});

const URL = '/api/v1/users/me/decks';

// Create a deck with a unique slug.
const makeDeck = (over = {}) =>
  Deck.create({
    title: over.title || 'Deck',
    slug: over.slug || `deck-${new mongoose.Types.ObjectId()}`,
    ownerType: 'user',
    ownerId: testUserId,
    status: 'published',
    ...over,
  });

describe('GET /api/v1/users/me/decks', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get(URL);
      expect(res.status).toBe(401);
    });
  });

  describe('scoping', () => {
    it("returns only the current user's decks", async () => {
      await makeDeck({ title: 'Mine 1', slug: 'mine-1' });
      await makeDeck({ title: 'Mine 2', slug: 'mine-2' });
      await Deck.create({
        title: 'Other',
        slug: 'other',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });
      // system deck must not appear in "my decks"
      await Deck.create({
        title: 'System',
        slug: 'system',
        ownerType: 'system',
        status: 'published',
      });

      const res = await request(app)
        .get(URL)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.totalItems).toBe(2);
      const titles = res.body.data.decks.map((d) => d.title);
      expect(titles.sort()).toEqual(['Mine 1', 'Mine 2']);
    });

    it('returns empty list when user owns no decks', async () => {
      const res = await request(app)
        .get(URL)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(0);
      expect(res.body.data.pagination.totalItems).toBe(0);
    });
  });

  describe('filtering', () => {
    it('searches by q (title or description, case-insensitive)', async () => {
      await makeDeck({ title: 'Travel Words', slug: 'travel' });
      await makeDeck({
        title: 'Business',
        slug: 'biz',
        description: 'travel abroad terms',
      });
      await makeDeck({ title: 'Cooking', slug: 'cook' });

      const res = await request(app)
        .get(`${URL}?q=TRAVEL`)
        .set('Authorization', `Bearer ${validToken}`);

      const titles = res.body.data.decks.map((d) => d.title).sort();
      expect(titles).toEqual(['Business', 'Travel Words']);
    });

    it('treats regex metachars in q as literal (no crash)', async () => {
      await makeDeck({ title: 'C(plus)', slug: 'c' });
      await makeDeck({ title: 'Plain', slug: 'plain' });

      const res = await request(app)
        .get(`${URL}?q=%28`) // "("
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.decks).toHaveLength(1);
      expect(res.body.data.decks[0].title).toBe('C(plus)');
    });
  });

  describe('pagination', () => {
    it('paginates with page and limit', async () => {
      for (let i = 0; i < 5; i++) {
        await makeDeck({ title: `D${i}`, slug: `d-${i}` });
      }

      const res = await request(app)
        .get(`${URL}?page=2&limit=2`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.decks).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        page: 2,
        limit: 2,
        totalItems: 5,
        totalPages: 3,
      });
    });

    it('defaults to page=1 limit=10', async () => {
      const res = await request(app)
        .get(URL)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });
  });

  describe('input validation', () => {
    it('returns 400 when limit exceeds 100', async () => {
      const res = await request(app)
        .get(`${URL}?limit=101`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'limit' })])
      );
    });

    it('returns 400 when page is less than 1', async () => {
      const res = await request(app)
        .get(`${URL}?page=0`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('response shape', () => {
    it('returns envelope with decks + pagination', async () => {
      await makeDeck({ title: 'X', slug: 'x' });

      const res = await request(app)
        .get(URL)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body).toMatchObject({
        success: true,
        message: 'Your decks retrieved successfully',
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
      expect(res.body.data.decks[0]).toMatchObject({
        ownerType: 'user',
        status: 'published',
      });
    });
  });
});
