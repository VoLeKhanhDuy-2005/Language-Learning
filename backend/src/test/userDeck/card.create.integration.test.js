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

const url = (deckId) => `/api/v1/users/me/decks/${deckId}/cards`;

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
    name: over.name || 'Family',
    slug: over.slug || `topic-${new mongoose.Types.ObjectId()}`,
    order: over.order ?? 1,
    cardCount: over.cardCount ?? 0,
  });

describe('POST /api/v1/users/me/decks/:deckId/cards', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const res = await request(app)
        .post(url(deck._id))
        .send({ topicId: topic._id, term: 'a', translation: 'b' });
      expect(res.status).toBe(401);
    });
  });

  describe('create', () => {
    it('creates a card with required fields only', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topic._id, term: 'family', translation: 'gia đình' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Card created successfully');
      expect(res.body.data.term).toBe('family');
      expect(res.body.data.translation).toBe('gia đình');
      expect(res.body.data.deckId).toBe(deck._id.toString());
      expect(res.body.data.topicId).toBe(topic._id.toString());
      expect(res.body.data.order).toBe(1);
      expect(res.body.data.pos).toBe('');
    });

    it('maps definition -> explanation.vi and example -> examples.en', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          topicId: topic._id,
          term: 'family',
          translation: 'gia đình',
          definition: 'Những người thân',
          example: 'My family is big.',
          pos: 'noun',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.explanation.vi).toBe('Những người thân');
      expect(res.body.data.examples.en).toBe('My family is big.');
      expect(res.body.data.pos).toBe('noun');
    });

    it('auto-assigns order = max + 1 within the topic', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      await Card.create({
        deckId: deck._id,
        topicId: topic._id,
        term: 'first',
        translation: 'x',
        order: 4,
      });

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topic._id, term: 'second', translation: 'y' });

      expect(res.body.data.order).toBe(5);
    });

    it('increments topic.cardCount and deck.cardCount', async () => {
      const deck = await makeMyDeck({ cardCount: 0 });
      const topic = await makeTopic(deck._id, { cardCount: 0 });

      await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topic._id, term: 'a', translation: 'b' });

      const [t, d] = await Promise.all([
        Topic.findById(topic._id),
        Deck.findById(deck._id),
      ]);
      expect(t.cardCount).toBe(1);
      expect(d.cardCount).toBe(1);
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
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topic._id, term: 'a', translation: 'b' });

      expect(res.status).toBe(404);
      expect(await Card.countDocuments({ deckId: deck._id })).toBe(0);
    });

    it('returns 404 when topicId belongs to a different deck', async () => {
      const deckA = await makeMyDeck();
      const deckB = await makeMyDeck();
      const topicInB = await makeTopic(deckB._id);

      const res = await request(app)
        .post(url(deckA._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topicInB._id, term: 'a', translation: 'b' });

      expect(res.status).toBe(404);
    });

    it('returns 404 for a system deck', async () => {
      const deck = await Deck.create({
        title: 'System',
        slug: 'system-deck',
        ownerType: 'system',
        status: 'published',
      });
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topic._id, term: 'a', translation: 'b' });

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid deckId', async () => {
      const res = await request(app)
        .post(url('notanid'))
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          topicId: new mongoose.Types.ObjectId(),
          term: 'a',
          translation: 'b',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });

    it('returns 400 when topicId is missing', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ term: 'a', translation: 'b' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when term is missing', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topic._id, translation: 'b' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when translation is missing', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ topicId: topic._id, term: 'a' });

      expect(res.status).toBe(400);
    });

    it('ignores extra fields (mass-assignment)', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          topicId: topic._id,
          term: 'a',
          translation: 'b',
          order: 99,
          deckId: otherUserId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order).toBe(1);
      expect(res.body.data.deckId).toBe(deck._id.toString());
    });
  });
});
