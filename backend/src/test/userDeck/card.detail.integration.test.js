import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Deck from '../../models/deck.model.js';
import Topic from '../../models/topic.model.js';
import Card from '../../models/card.model.js';
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
  ]);
});

const url = (deckId, cardId) =>
  `/api/v1/users/me/decks/${deckId}/cards/${cardId}`;

const makeMyDeck = () =>
  Deck.create({
    title: 'My Deck',
    slug: `deck-${new mongoose.Types.ObjectId()}`,
    ownerType: 'user',
    ownerId: testUserId,
    status: 'published',
  });

const makeTopic = (deckId) =>
  Topic.create({
    deckId,
    name: 'T',
    slug: `topic-${new mongoose.Types.ObjectId()}`,
    order: 1,
  });

const makeCard = (deckId, topicId, over = {}) =>
  Card.create({
    deckId,
    topicId,
    term: over.term || 'family',
    translation: over.translation || 'gia đình',
    order: over.order ?? 1,
  });

describe('GET /api/v1/users/me/decks/:deckId/cards/:cardId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id);
      const res = await request(app).get(url(deck._id, card._id));
      expect(res.status).toBe(401);
    });
  });

  describe('detail', () => {
    it('returns the card', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id, { term: 'family' });

      const res = await request(app)
        .get(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Card detail retrieved successfully');
      expect(res.body.data._id).toBe(card._id.toString());
      expect(res.body.data.term).toBe('family');
      expect(res.body.data.deckId).toBe(deck._id.toString());
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
        .get(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 when the card belongs to a different deck', async () => {
      const deckA = await makeMyDeck();
      const deckB = await makeMyDeck();
      const topicB = await makeTopic(deckB._id);
      const cardInB = await makeCard(deckB._id, topicB._id);

      const res = await request(app)
        .get(url(deckA._id, cardInB._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 when the card does not exist', async () => {
      const deck = await makeMyDeck();
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(url(deck._id, ghostId))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid cardId', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .get(url(deck._id, 'notanid'))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'cardId' })])
      );
    });

    it('returns 400 for an invalid deckId', async () => {
      const card = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(url('notanid', card))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });
  });
});
