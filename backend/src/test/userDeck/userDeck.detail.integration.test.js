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

const url = (deckId) => `/api/v1/users/me/decks/${deckId}`;

const makeMyDeck = (over = {}) =>
  Deck.create({
    title: over.title || 'My Deck',
    slug: over.slug || `deck-${new mongoose.Types.ObjectId()}`,
    ownerType: 'user',
    ownerId: testUserId,
    status: 'published',
    ...over,
  });

describe('GET /api/v1/users/me/decks/:deckId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const res = await request(app).get(url(deck._id));
      expect(res.status).toBe(401);
    });
  });

  describe('ownership', () => {
    it("returns the user's own deck", async () => {
      const deck = await makeMyDeck({ title: 'Mine' });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Mine');
      expect(res.body.data.ownerId).toBe(testUserId.toString());
    });

    it("returns 404 for another user's deck", async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 for a system deck (not a user-owned deck)', async () => {
      const deck = await Deck.create({
        title: 'System',
        slug: 'system',
        ownerType: 'system',
        status: 'published',
      });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 when the deck does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(url(ghostId))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid deckId', async () => {
      const res = await request(app)
        .get(url('notanid'))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });
  });

  describe('response shape', () => {
    it('returns the correct envelope', async () => {
      const deck = await makeMyDeck({ title: 'X', slug: 'x' });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Deck detail retrieved successfully',
        data: { title: 'X', ownerType: 'user', status: 'published' },
      });
      expect(res.body.data._id).toBe(deck._id.toString());
    });
  });
});
