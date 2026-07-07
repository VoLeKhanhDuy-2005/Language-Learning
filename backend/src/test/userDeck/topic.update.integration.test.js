import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Deck from '../../models/deck.model.js';
import Topic from '../../models/topic.model.js';
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
  await Promise.all([Deck.deleteMany({}), Topic.deleteMany({})]);
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
    ...over,
  });

const makeTopic = (deckId, over = {}) =>
  Topic.create({
    deckId,
    name: over.name || 'Old Name',
    slug: over.slug || 'old-slug-abc12345',
    order: over.order ?? 1,
    cardCount: over.cardCount ?? 0,
  });

describe('PUT /api/v1/users/me/decks/:deckId/topics/:topicId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const res = await request(app)
        .put(url(deck._id, topic._id))
        .send({ name: 'New' });
      expect(res.status).toBe(401);
    });
  });

  describe('update', () => {
    it('updates the topic name', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id, { name: 'Old Name' });

      const res = await request(app)
        .put(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Topic updated successfully');
      expect(res.body.data.name).toBe('New Name');

      const inDb = await Topic.findById(topic._id);
      expect(inDb.name).toBe('New Name');
    });

    it('keeps the slug stable when the name changes', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id, { slug: 'old-slug-abc12345' });

      const res = await request(app)
        .put(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Completely Different' });

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('old-slug-abc12345');
    });

    it('keeps order unchanged', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id, { order: 7 });

      const res = await request(app)
        .put(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Renamed' });

      expect(res.body.data.order).toBe(7);
    });

    it('ignores attempts to change order/cardCount/deckId (mass-assignment)', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id, { order: 1, cardCount: 0 });

      const res = await request(app)
        .put(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Renamed',
          order: 99,
          cardCount: 50,
          deckId: otherUserId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order).toBe(1);
      expect(res.body.data.cardCount).toBe(0);
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

      const res = await request(app)
        .put(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(404);
      const inDb = await Topic.findById(topic._id);
      expect(inDb.name).toBe('Old Name');
    });

    it('returns 404 when the topic belongs to a different deck', async () => {
      const deckA = await makeMyDeck();
      const deckB = await makeMyDeck();
      const topicInB = await makeTopic(deckB._id);

      const res = await request(app)
        .put(url(deckA._id, topicInB._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'X' });

      expect(res.status).toBe(404);
    });

    it('returns 404 when the topic does not exist', async () => {
      const deck = await makeMyDeck();
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(url(deck._id, ghostId))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'X' });

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid topicId', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .put(url(deck._id, 'notanid'))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'X' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'topicId' })])
      );
    });

    it('returns 400 when name is missing', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .put(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when name is empty/whitespace', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);

      const res = await request(app)
        .put(url(deck._id, topic._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
    });
  });
});
