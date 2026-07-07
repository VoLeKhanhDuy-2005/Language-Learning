import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Deck from '../../models/deck.model.js';
import Topic from '../../models/topic.model.js';
import Card from '../../models/card.model.js';
import UserCardState from '../../models/userCardState.model.js';
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
  await Promise.all([
    Deck.deleteMany({}),
    Topic.deleteMany({}),
    Card.deleteMany({}),
    UserCardState.deleteMany({}),
  ]);
});

const url = (deckId) => `/api/v1/users/me/decks/${deckId}/topics`;

const makeMyDeck = (over = {}) =>
  Deck.create({
    title: over.title || 'My Deck',
    slug: over.slug || `deck-${new mongoose.Types.ObjectId()}`,
    ownerType: 'user',
    ownerId: testUserId,
    status: 'published',
    ...over,
  });

const makeTopic = (deckId, over = {}) =>
  Topic.create({
    deckId,
    name: over.name || 'Topic',
    slug: over.slug || `topic-${new mongoose.Types.ObjectId()}`,
    order: over.order ?? 1,
    cardCount: over.cardCount ?? 0,
  });

describe('GET /api/v1/users/me/decks/:deckId/topics', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const res = await request(app).get(url(deck._id));
      expect(res.status).toBe(401);
    });
  });

  describe('list', () => {
    it('returns the deck and an empty topics array', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Topics retrieved successfully');
      expect(res.body.data.deck._id).toBe(deck._id.toString());
      expect(res.body.data.topics).toEqual([]);
    });

    it('returns topics sorted by order', async () => {
      const deck = await makeMyDeck();
      await makeTopic(deck._id, { name: 'B', order: 2 });
      await makeTopic(deck._id, { name: 'A', order: 1 });
      await makeTopic(deck._id, { name: 'C', order: 3 });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      const names = res.body.data.topics.map((t) => t.name);
      expect(names).toEqual(['A', 'B', 'C']);
    });

    it('returns plain topics without userProgress', async () => {
      const deck = await makeMyDeck();
      await makeTopic(deck._id, { name: 'Family', cardCount: 10 });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics[0].name).toBe('Family');
      expect(res.body.data.topics[0].userProgress).toBeUndefined();
    });
  });

  describe('ownership', () => {
    it("returns 404 for another user's deck", async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other-deck',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 for a system deck', async () => {
      const deck = await Deck.create({
        title: 'System',
        slug: 'system-deck',
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
});
