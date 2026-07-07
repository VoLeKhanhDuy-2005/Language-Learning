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

const url = (deckId, cardId) =>
  `/api/v1/users/me/decks/${deckId}/cards/${cardId}`;

const makeMyDeck = (over = {}) =>
  Deck.create({
    title: 'My Deck',
    slug: `deck-${new mongoose.Types.ObjectId()}`,
    ownerType: 'user',
    ownerId: testUserId,
    status: 'published',
    cardCount: over.cardCount ?? 0,
    ...over,
  });

const makeTopic = (deckId, over = {}) =>
  Topic.create({
    deckId,
    name: 'T',
    slug: `topic-${new mongoose.Types.ObjectId()}`,
    order: 1,
    cardCount: over.cardCount ?? 0,
  });

const makeCard = (deckId, topicId, over = {}) =>
  Card.create({
    deckId,
    topicId,
    term: over.term || 'family',
    translation: over.translation || 'gia đình',
    order: over.order ?? 1,
  });

describe('DELETE /api/v1/users/me/decks/:deckId/cards/:cardId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id);
      const res = await request(app).delete(url(deck._id, card._id));
      expect(res.status).toBe(401);
    });
  });

  describe('delete', () => {
    it('deletes the card and returns 200', async () => {
      const deck = await makeMyDeck({ cardCount: 1 });
      const topic = await makeTopic(deck._id, { cardCount: 1 });
      const card = await makeCard(deck._id, topic._id);

      const res = await request(app)
        .delete(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Card deleted successfully');
      expect(await Card.findById(card._id)).toBeNull();
    });

    it('decrements topic.cardCount and deck.cardCount', async () => {
      const deck = await makeMyDeck({ cardCount: 5 });
      const topic = await makeTopic(deck._id, { cardCount: 3 });
      const card = await makeCard(deck._id, topic._id);

      await request(app)
        .delete(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`);

      const [t, d] = await Promise.all([
        Topic.findById(topic._id),
        Deck.findById(deck._id),
      ]);
      expect(t.cardCount).toBe(2);
      expect(d.cardCount).toBe(4);
    });

    it('cascades delete to user card states', async () => {
      const deck = await makeMyDeck({ cardCount: 1 });
      const topic = await makeTopic(deck._id, { cardCount: 1 });
      const card = await makeCard(deck._id, topic._id);
      await UserCardState.create({
        userId: testUserId,
        cardId: card._id,
        deckId: deck._id,
        topicId: topic._id,
      });

      await request(app)
        .delete(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(await UserCardState.countDocuments({ cardId: card._id })).toBe(0);
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
      const card = await makeCard(deck._id, topic._id);

      const res = await request(app)
        .delete(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(await Card.findById(card._id)).not.toBeNull();
    });

    it('returns 404 when the card is in a different deck', async () => {
      const deckA = await makeMyDeck();
      const deckB = await makeMyDeck();
      const topicB = await makeTopic(deckB._id);
      const cardInB = await makeCard(deckB._id, topicB._id);

      const res = await request(app)
        .delete(url(deckA._id, cardInB._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(await Card.findById(cardInB._id)).not.toBeNull();
    });

    it('returns 404 when the card does not exist', async () => {
      const deck = await makeMyDeck();
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(url(deck._id, ghostId))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid cardId', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .delete(url(deck._id, 'notanid'))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'cardId' })])
      );
    });
  });
});
