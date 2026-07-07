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

const makeDeck = () =>
  Deck.create({
    title: 'Travel',
    slug: 'travel',
    ownerType: 'system',
    status: 'published',
  });

const makeTopic = (deckId) =>
  Topic.create({
    deckId,
    name: 'Family',
    slug: 'family',
    order: 1,
    cardCount: 0,
  });

const makeCard = (deckId, topicId, order, term) =>
  Card.create({
    deckId,
    topicId,
    order,
    term,
    pos: 'noun',
    translation: 'x',
  });

const url = (deckId, topicId) =>
  `/api/v1/decks/${deckId}/topics/${topicId}/cards`;

describe('GET /api/v1/decks/:deckId/topics/:topicId/cards', () => {
  describe('authentication', () => {
    it('returns 401 without Bearer token', async () => {
      const deck = await makeDeck();
      const topic = await makeTopic(deck._id);
      const res = await request(app).get(url(deck._id, topic._id));
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
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 when topic does not belong to the deck', async () => {
      const deck = await makeDeck();
      const otherDeck = await Deck.create({
        title: 'Other Deck',
        slug: 'other-deck',
        ownerType: 'system',
        status: 'published',
      });
      const topic = await makeTopic(otherDeck._id); // topic in different deck

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 when topic does not exist', async () => {
      const deck = await makeDeck();
      const ghostTopic = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(url(deck._id, ghostTopic))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid deckId', async () => {
      const topic = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/decks/notanid/topics/${topic}/cards`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });

    it('returns 400 for invalid topicId', async () => {
      const deck = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/decks/${deck}/topics/notanid/cards`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'topicId' })])
      );
    });
  });

  describe('cards + user state', () => {
    it('returns cards ordered by order field', async () => {
      const deck = await makeDeck();
      const topic = await makeTopic(deck._id);
      await makeCard(deck._id, topic._id, 2, 'second');
      await makeCard(deck._id, topic._id, 1, 'first');

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cards.map((c) => c.card.term)).toEqual([
        'first',
        'second',
      ]);
    });

    it('returns userCardState=null when user has no state for a card', async () => {
      const deck = await makeDeck();
      const topic = await makeTopic(deck._id);
      await makeCard(deck._id, topic._id, 1, 'family');

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cards[0].userCardState).toBeNull();
    });

    it("attaches the current user's card state when present", async () => {
      const deck = await makeDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id, 1, 'family');

      await UserCardState.create({
        userId: testUserId,
        cardId: card._id,
        deckId: deck._id,
        topicId: topic._id,
        srs: { lastGrade: 4, interval: 3 },
        flags: { starred: true },
      });

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      const state = res.body.data.cards[0].userCardState;
      expect(state).not.toBeNull();
      expect(state.cardId).toBe(card._id.toString());
      expect(state.srs.lastGrade).toBe(4);
      expect(state.flags.starred).toBe(true);
    });

    it("does not attach another user's card state", async () => {
      const deck = await makeDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id, 1, 'family');

      await UserCardState.create({
        userId: otherUserId,
        cardId: card._id,
        deckId: deck._id,
        topicId: topic._id,
      });

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.cards[0].userCardState).toBeNull();
    });

    it('returns empty array for a topic with no cards', async () => {
      const deck = await makeDeck();
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cards).toHaveLength(0);
    });
  });

  describe('response shape', () => {
    it('returns correct envelope with card + userCardState items', async () => {
      const deck = await makeDeck();
      const topic = await makeTopic(deck._id);
      await makeCard(deck._id, topic._id, 1, 'family');

      const res = await request(app)
        .get(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Topic cards retrieved successfully',
        data: { cards: expect.any(Array) },
      });
      expect(res.body.data.cards[0]).toMatchObject({
        card: { term: 'family', order: 1 },
      });
      expect(res.body.data.cards[0]).toHaveProperty('userCardState');
    });
  });
});
