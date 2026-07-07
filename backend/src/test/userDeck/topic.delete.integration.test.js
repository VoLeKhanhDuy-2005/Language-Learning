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

const url = (deckId, topicId) =>
  `/api/v1/users/me/decks/${deckId}/topics/${topicId}`;

const makeMyDeck = (over = {}) =>
  Deck.create({
    title: 'My Deck',
    slug: `deck-${new mongoose.Types.ObjectId()}`,
    ownerType: 'user',
    ownerId: testUserId,
    status: 'published',
    topicCount: over.topicCount ?? 0,
    cardCount: over.cardCount ?? 0,
    ...over,
  });

const makeTopic = (deckId, over = {}) =>
  Topic.create({
    deckId,
    name: over.name || 'Family',
    slug: over.slug || `topic-${new mongoose.Types.ObjectId()}`,
    order: over.order ?? 1,
    cardCount: over.cardCount ?? 0,
  });

const makeCard = (deckId, topicId, over = {}) =>
  Card.create({
    deckId,
    topicId,
    term: over.term || 'word',
    pos: 'noun',
    translation: 'x',
    order: over.order ?? 1,
  });

describe('DELETE /api/v1/users/me/decks/:deckId/topics/:topicId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const res = await request(app).delete(url(deck._id, topic._id));
      expect(res.status).toBe(401);
    });
  });

  describe('delete', () => {
    it('deletes the topic and returns 200', async () => {
      const deck = await makeMyDeck({ topicCount: 1 });
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .delete(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Topic deleted successfully');
      expect(await Topic.findById(topic._id)).toBeNull();
    });

    it('cascades delete to cards and user card states', async () => {
      const deck = await makeMyDeck({ topicCount: 1, cardCount: 2 });
      const topic = await makeTopic(deck._id, { cardCount: 2 });
      const card1 = await makeCard(deck._id, topic._id, { order: 1 });
      const card2 = await makeCard(deck._id, topic._id, { order: 2 });
      await UserCardState.create({
        userId: testUserId,
        cardId: card1._id,
        deckId: deck._id,
        topicId: topic._id,
      });
      await UserCardState.create({
        userId: testUserId,
        cardId: card2._id,
        deckId: deck._id,
        topicId: topic._id,
      });

      await request(app)
        .delete(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      const [cards, states] = await Promise.all([
        Card.countDocuments({ topicId: topic._id }),
        UserCardState.countDocuments({ topicId: topic._id }),
      ]);
      expect(cards).toBe(0);
      expect(states).toBe(0);
    });

    it('decrements deck topicCount and cardCount', async () => {
      const deck = await makeMyDeck({ topicCount: 3, cardCount: 10 });
      const topic = await makeTopic(deck._id, { cardCount: 2 });
      await makeCard(deck._id, topic._id, { order: 1 });
      await makeCard(deck._id, topic._id, { order: 2 });

      await request(app)
        .delete(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      const inDb = await Deck.findById(deck._id);
      expect(inDb.topicCount).toBe(2);
      expect(inDb.cardCount).toBe(8);
    });

    it('does not touch cards in sibling topics', async () => {
      const deck = await makeMyDeck({ topicCount: 2 });
      const topicA = await makeTopic(deck._id, { name: 'A', order: 1 });
      const topicB = await makeTopic(deck._id, { name: 'B', order: 2 });
      await makeCard(deck._id, topicB._id, { order: 1 });

      await request(app)
        .delete(url(deck._id, topicA._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(await Card.countDocuments({ topicId: topicB._id })).toBe(1);
    });
  });

  describe('ownership / scoping', () => {
    it('returns 404 when the deck belongs to another user', async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other-deck',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .delete(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(await Topic.findById(topic._id)).not.toBeNull();
    });

    it('returns 404 when the topic belongs to a different deck', async () => {
      const deckA = await makeMyDeck();
      const deckB = await makeMyDeck();
      const topicInB = await makeTopic(deckB._id);

      const res = await request(app)
        .delete(url(deckA._id, topicInB._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(await Topic.findById(topicInB._id)).not.toBeNull();
    });

    it('returns 404 when the topic does not exist', async () => {
      const deck = await makeMyDeck();
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(url(deck._id, ghostId))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid topicId', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .delete(url(deck._id, 'notanid'))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'topicId' })])
      );
    });
  });
});
