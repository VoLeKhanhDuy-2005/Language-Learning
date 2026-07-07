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

describe('POST /api/v1/users/me/decks/:deckId/topics', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .post(url(deck._id))
        .send({ name: 'Family' });
      expect(res.status).toBe(401);
    });
  });

  describe('create', () => {
    it('creates a topic and returns 201', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Family' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Topic created successfully');
      expect(res.body.data.name).toBe('Family');
      expect(res.body.data.deckId).toBe(deck._id.toString());
      expect(res.body.data.order).toBe(1);
      expect(res.body.data.cardCount).toBe(0);
      expect(res.body.data.slug).toMatch(/^family-[0-9a-f]{8}$/);
    });

    it('auto-assigns order = max + 1 for subsequent topics', async () => {
      const deck = await makeMyDeck();
      await Topic.create({
        deckId: deck._id,
        name: 'First',
        slug: 'first',
        order: 5,
      });

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Second' });

      expect(res.status).toBe(201);
      expect(res.body.data.order).toBe(6);
    });

    it('increments the deck topicCount', async () => {
      const deck = await makeMyDeck();

      await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Family' });

      const inDb = await Deck.findById(deck._id);
      expect(inDb.topicCount).toBe(1);
    });

    it('generates a slug for Vietnamese names', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Gia đình' });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toMatch(/^gia-dinh-[0-9a-f]{8}$/);
    });
  });

  describe('ownership', () => {
    it("returns 404 when adding a topic to another user's deck", async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other-deck',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(404);
      expect(await Topic.countDocuments({ deckId: deck._id })).toBe(0);
    });

    it('returns 404 when the deck does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(url(ghostId))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'X' });

      expect(res.status).toBe(404);
    });

    it('returns 404 when targeting a system deck', async () => {
      const deck = await Deck.create({
        title: 'System',
        slug: 'system-deck',
        ownerType: 'system',
        status: 'published',
      });

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'X' });

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid deckId', async () => {
      const res = await request(app)
        .post(url('notanid'))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'X' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });

    it('returns 400 when name is missing', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when name is empty/whitespace', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
    });

    it('ignores extra fields (mass-assignment)', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .post(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Family',
          order: 99,
          cardCount: 50,
          deckId: otherUserId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order).toBe(1); // auto, not 99
      expect(res.body.data.cardCount).toBe(0); // not 50
      expect(res.body.data.deckId).toBe(deck._id.toString()); // from path, not body
    });
  });
});
