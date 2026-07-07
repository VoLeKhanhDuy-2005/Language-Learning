import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Deck from '../../models/deck.model.js';
import Topic from '../../models/topic.model.js';
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
    UserCardState.deleteMany({}),
  ]);
});

const makeDeck = () =>
  Deck.create({
    title: 'Travel',
    slug: 'travel',
    ownerType: 'system',
    status: 'published',
  });

// Seed N userCardState docs for a topic, for a given user.
const seedStates = (userId, deckId, topicId, count, hidden = false) =>
  UserCardState.insertMany(
    Array.from({ length: count }, () => ({
      userId,
      cardId: new mongoose.Types.ObjectId(),
      deckId,
      topicId,
      flags: { hidden },
    }))
  );

describe('GET /api/v1/decks/:deckId/topics', () => {
  describe('authentication', () => {
    it('returns 401 without Bearer token', async () => {
      const deck = await makeDeck();
      const res = await request(app).get(`/api/v1/decks/${deck._id}/topics`);
      expect(res.status).toBe(401);
    });
  });

  describe('access control', () => {
    it("returns 404 for another user's deck", async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 when deck does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/decks/${ghostId}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid deckId', async () => {
      const res = await request(app)
        .get('/api/v1/decks/notanid/topics')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });
  });

  describe('topics + progress', () => {
    it('returns topics ordered by order field', async () => {
      const deck = await makeDeck();
      await Topic.insertMany([
        {
          deckId: deck._id,
          name: 'Second',
          slug: 'second',
          order: 2,
          cardCount: 10,
        },
        {
          deckId: deck._id,
          name: 'First',
          slug: 'first',
          order: 1,
          cardCount: 10,
        },
      ]);

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics.map((t) => t.topic.name)).toEqual([
        'First',
        'Second',
      ]);
    });

    it('returns zero progress when user has no card states', async () => {
      const deck = await makeDeck();
      await Topic.create({
        deckId: deck._id,
        name: 'Family',
        slug: 'family',
        order: 1,
        cardCount: 49,
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics[0].userProgress).toEqual({
        learnedCardCount: 0,
        totalCardCount: 49,
        progressPct: 0,
      });
    });

    it('computes learnedCardCount and progressPct from user card states', async () => {
      const deck = await makeDeck();
      const topic = await Topic.create({
        deckId: deck._id,
        name: 'Family',
        slug: 'family',
        order: 1,
        cardCount: 49,
      });

      await seedStates(testUserId, deck._id, topic._id, 1);

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics[0].userProgress).toEqual({
        learnedCardCount: 1,
        totalCardCount: 49,
        progressPct: 2, // round(1/49*100)
      });
    });

    it('counts progress per topic independently', async () => {
      const deck = await makeDeck();
      const [t1, t2] = await Topic.insertMany([
        { deckId: deck._id, name: 'A', slug: 'a', order: 1, cardCount: 10 },
        { deckId: deck._id, name: 'B', slug: 'b', order: 2, cardCount: 10 },
      ]);

      await seedStates(testUserId, deck._id, t1._id, 5);
      await seedStates(testUserId, deck._id, t2._id, 2);

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      const byName = Object.fromEntries(
        res.body.data.topics.map((t) => [t.topic.name, t.userProgress])
      );
      expect(byName.A).toEqual({
        learnedCardCount: 5,
        totalCardCount: 10,
        progressPct: 50,
      });
      expect(byName.B).toEqual({
        learnedCardCount: 2,
        totalCardCount: 10,
        progressPct: 20,
      });
    });

    it("does not count another user's card states", async () => {
      const deck = await makeDeck();
      const topic = await Topic.create({
        deckId: deck._id,
        name: 'Family',
        slug: 'family',
        order: 1,
        cardCount: 10,
      });

      await seedStates(otherUserId, deck._id, topic._id, 7);

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.topics[0].userProgress.learnedCardCount).toBe(0);
    });

    it('counts hidden cards as learned (a state row means the term was studied)', async () => {
      const deck = await makeDeck();
      const topic = await Topic.create({
        deckId: deck._id,
        name: 'Family',
        slug: 'family',
        order: 1,
        cardCount: 10,
      });

      await seedStates(testUserId, deck._id, topic._id, 3, false);
      await seedStates(testUserId, deck._id, topic._id, 2, true); // hidden still counts

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      // learned = 3 + 2 = 5, total = 10 -> pct = 50
      expect(res.body.data.topics[0].userProgress).toEqual({
        learnedCardCount: 5,
        totalCardCount: 10,
        progressPct: 50,
      });
    });

    it('reaches 100% when every card in the topic has a state', async () => {
      const deck = await makeDeck();
      const topic = await Topic.create({
        deckId: deck._id,
        name: 'Family',
        slug: 'family',
        order: 1,
        cardCount: 100,
      });

      await seedStates(testUserId, deck._id, topic._id, 10, false);
      await seedStates(testUserId, deck._id, topic._id, 90, true); // hidden, still learned

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      // learned = 100, total = 100 -> 100%
      expect(res.body.data.topics[0].userProgress).toEqual({
        learnedCardCount: 100,
        totalCardCount: 100,
        progressPct: 100,
      });
    });

    it('returns empty topics array for a deck with no topics', async () => {
      const deck = await makeDeck();

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics).toHaveLength(0);
    });
  });

  describe('response shape', () => {
    it('returns deck and topics with correct envelope', async () => {
      const deck = await makeDeck();
      await Topic.create({
        deckId: deck._id,
        name: 'Family',
        slug: 'family',
        order: 1,
        cardCount: 10,
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}/topics`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Deck topics retrieved successfully',
        data: {
          deck: { title: 'Travel', slug: 'travel' },
          topics: expect.any(Array),
        },
      });
      expect(res.body.data.topics[0]).toMatchObject({
        topic: { name: 'Family', order: 1, cardCount: 10 },
        userProgress: {
          learnedCardCount: expect.any(Number),
          totalCardCount: expect.any(Number),
          progressPct: expect.any(Number),
        },
      });
    });
  });
});
