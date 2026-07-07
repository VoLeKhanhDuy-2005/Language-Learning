import User from '../../models/user.model.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Deck from '../../models/deck.model.js';
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
  await Deck.deleteMany({});
});

const url = (deckId) => `/api/v1/users/me/decks/${deckId}`;

const makeMyDeck = (over = {}) =>
  Deck.create({
    title: over.title || 'My Deck',
    slug: over.slug || `deck-${new mongoose.Types.ObjectId()}`,
    description: over.description || 'old desc',
    ownerType: 'user',
    ownerId: testUserId,
    status: 'published',
    ...over,
  });

describe('PUT /api/v1/users/me/decks/:deckId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const res = await request(app).put(url(deck._id)).send({ title: 'New' });
      expect(res.status).toBe(401);
    });
  });

  describe('update', () => {
    it('updates the title', async () => {
      const deck = await makeMyDeck({ title: 'Old', slug: 'old' });

      const res = await request(app)
        .put(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Deck updated successfully');
      expect(res.body.data.title).toBe('New Title');

      const inDb = await Deck.findById(deck._id);
      expect(inDb.title).toBe('New Title');
    });

    it('updates only the description, leaving title intact', async () => {
      const deck = await makeMyDeck({ title: 'Keep', slug: 'keep' });

      const res = await request(app)
        .put(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ description: 'updated desc' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Keep');
      expect(res.body.data.description).toBe('updated desc');
    });

    it('keeps the slug stable when the title changes', async () => {
      const deck = await makeMyDeck({ title: 'Old', slug: 'old-abc123' });

      const res = await request(app)
        .put(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Completely Different' });

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('old-abc123'); // unchanged
    });
  });

  describe('ownership', () => {
    it("returns 404 when updating another user's deck", async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .put(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(404);

      const inDb = await Deck.findById(deck._id);
      expect(inDb.title).toBe('Other'); // untouched
    });

    it('returns 404 when the deck does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(url(ghostId))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'X' });

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid deckId', async () => {
      const res = await request(app)
        .put(url('notanid'))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'X' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });

    it('returns 400 when no updatable field is provided', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .put(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when title is empty', async () => {
      const deck = await makeMyDeck();

      const res = await request(app)
        .put(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
    });

    it('ignores attempts to change ownerId/status (mass-assignment)', async () => {
      const deck = await makeMyDeck({ title: 'Safe', slug: 'safe' });

      const res = await request(app)
        .put(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Renamed', ownerId: otherUserId, status: 'archived' });

      expect(res.status).toBe(200);
      expect(res.body.data.ownerId).toBe(testUserId.toString()); // unchanged
      expect(res.body.data.status).toBe('published'); // unchanged
    });
  });
});
