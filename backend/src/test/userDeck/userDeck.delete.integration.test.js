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

describe('DELETE /api/v1/users/me/decks/:deckId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const res = await request(app).delete(url(deck._id));
      expect(res.status).toBe(401);
    });
  });

  describe('delete', () => {
    it('deletes the deck and returns 200', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .delete(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Deck deleted successfully');

      const inDb = await Deck.findById(deck._id);
      expect(inDb).toBeNull();
    });

    it('cascades delete to topics and cards', async () => {
      const deck = await makeMyDeck();
      const topic = await Topic.create({
        deckId: deck._id,
        name: 'Family',
        slug: 'family',
        order: 1,
      });
      const card = await Card.create({
        deckId: deck._id,
        topicId: topic._id,
        term: 'hello',
        pos: 'noun',
        translation: 'xin chào',
        order: 1,
      });
      await UserCardState.create({
        userId: testUserId,
        cardId: card._id,
        deckId: deck._id,
        topicId: topic._id,
      });

      await request(app)
        .delete(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      const [topicCount, cardCount, stateCount] = await Promise.all([
        Topic.countDocuments({ deckId: deck._id }),
        Card.countDocuments({ deckId: deck._id }),
        UserCardState.countDocuments({ cardId: card._id }),
      ]);

      expect(topicCount).toBe(0);
      expect(cardCount).toBe(0);
      expect(stateCount).toBe(0);
    });

    it('deletes deck with no topics/cards without error', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .delete(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('ownership', () => {
    it("returns 404 when deleting another user's deck", async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other-deck',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .delete(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);

      const inDb = await Deck.findById(deck._id);
      expect(inDb).not.toBeNull();
    });

    it('returns 404 when deck does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(url(ghostId))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid deckId', async () => {
      const res = await request(app)
        .delete(url('notanid'))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });
  });
});
