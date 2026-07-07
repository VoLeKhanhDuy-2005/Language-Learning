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

describe('POST /api/v1/users/me/decks', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).post(URL).send({ title: 'My Deck' });
      expect(res.status).toBe(401);
    });
  });

  describe('create', () => {
    it('creates a user-owned, published deck from just a title', async () => {
      const res = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'My Words' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Deck created successfully',
        data: {
          title: 'My Words',
          ownerType: 'user',
          status: 'published',
        },
      });
      expect(res.body.data.ownerId).toBe(testUserId.toString());
      expect(res.body.data.slug).toMatch(/^my-words-[0-9a-f]{8}$/);
      expect(res.body.data.publishedAt).toBeTruthy();

      // Persisted in DB
      const inDb = await Deck.findById(res.body.data._id);
      expect(inDb).not.toBeNull();
      expect(inDb.ownerId.toString()).toBe(testUserId.toString());
    });

    it('accepts an optional description', async () => {
      const res = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Deck', description: 'my notes' });

      expect(res.status).toBe(201);
      expect(res.body.data.description).toBe('my notes');
    });

    it('builds a slug from a Vietnamese title (diacritics stripped)', async () => {
      const res = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Bộ thẻ của tôi' });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toMatch(/^bo-the-cua-toi-[0-9a-f]{8}$/);
    });

    it('generates unique slugs for the same title', async () => {
      const r1 = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Same' });
      const r2 = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Same' });

      expect(r1.status).toBe(201);
      expect(r2.status).toBe(201);
      expect(r1.body.data.slug).not.toBe(r2.body.data.slug);
    });
  });

  describe('max 3 decks rule', () => {
    it('rejects creating a 4th deck', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post(URL)
          .set('Authorization', `Bearer ${validToken}`)
          .send({ title: `Deck ${i}` });
        expect(res.status).toBe(201);
      }

      const fourth = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Deck 4' });

      expect(fourth.status).toBe(400);
      expect(fourth.body.success).toBe(false);
      expect(fourth.body.message).toMatch(/at most 3/i);

      // Still only 3 in DB
      const count = await Deck.countDocuments({ ownerId: testUserId });
      expect(count).toBe(3);
    });

    it("counts only the current user's decks toward the limit", async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      // Other user owns 3 decks already
      await Deck.insertMany(
        [0, 1, 2].map((i) => ({
          title: `Other ${i}`,
          slug: `other-${i}`,
          ownerType: 'user',
          ownerId: otherUserId,
          status: 'published',
        }))
      );

      const res = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Mine' });

      expect(res.status).toBe(201); // not blocked by other user's decks
    });
  });

  describe('input validation', () => {
    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'title' })])
      );
    });

    it('returns 400 when title is empty/whitespace', async () => {
      const res = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when title exceeds 100 chars', async () => {
      const res = await request(app)
        .post(URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'a'.repeat(101) });

      expect(res.status).toBe(400);
    });
  });
});
