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

const makeToken = (userId) =>
  generateToken({ id: userId, role: 'user', type: 'ACCESS' }, '15m');

const validToken = makeToken(testUserId);

describe('GET /api/v1/decks/:deckId', () => {
  describe('authentication', () => {
    it('returns 401 when no Bearer token provided', async () => {
      const deck = await Deck.create({
        title: 'System Deck',
        slug: 'system-deck',
        ownerType: 'system',
        status: 'published',
      });

      const res = await request(app).get(`/api/v1/decks/${deck._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when Bearer token is invalid', async () => {
      const deck = await Deck.create({
        title: 'System Deck',
        slug: 'system-deck',
        ownerType: 'system',
        status: 'published',
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}`)
        .set('Authorization', 'Bearer not.a.valid.token');

      expect(res.status).toBe(401);
    });
  });

  describe('access control', () => {
    it('returns system published deck to any authenticated user', async () => {
      const deck = await Deck.create({
        title: 'Travel Vocabulary',
        slug: 'travel-vocabulary',
        ownerType: 'system',
        status: 'published',
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Travel Vocabulary');
    });

    it("returns 404 for the user's own deck (use /users/me/decks instead)", async () => {
      // Public /decks serves the system catalog only; user decks are not exposed here.
      const deck = await Deck.create({
        title: 'My Deck',
        slug: 'my-deck',
        ownerType: 'user',
        ownerId: testUserId,
        status: 'published',
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 for another user's deck", async () => {
      // User decks are always status:'published'; still inaccessible to others
      const deck = await Deck.create({
        title: 'Other User Deck',
        slug: 'other-user-deck',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for system draft deck', async () => {
      const deck = await Deck.create({
        title: 'System Draft',
        slug: 'system-draft',
        ownerType: 'system',
        status: 'draft',
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 when deckId is not a valid ObjectId', async () => {
      const res = await request(app)
        .get('/api/v1/decks/notanobjectid')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });

    it('returns 404 when deckId is valid ObjectId but deck does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/decks/${nonExistentId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('response shape', () => {
    it('returns correct envelope with deck data', async () => {
      const deck = await Deck.create({
        title: 'Travel Vocabulary',
        slug: 'travel-vocabulary',
        ownerType: 'system',
        status: 'published',
        description: 'Common travel words',
        topicCount: 3,
        cardCount: 30,
      });

      const res = await request(app)
        .get(`/api/v1/decks/${deck._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Deck detail retrieved successfully',
        data: {
          title: 'Travel Vocabulary',
          slug: 'travel-vocabulary',
          ownerType: 'system',
          status: 'published',
          description: 'Common travel words',
          topicCount: 3,
          cardCount: 30,
        },
      });
      expect(res.body.data._id).toBe(deck._id.toString());
    });
  });
});
