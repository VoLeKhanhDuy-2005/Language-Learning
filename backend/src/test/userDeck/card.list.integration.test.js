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
    term: over.term || 'word',
    translation: over.translation || 'nghĩa',
    order: over.order ?? 1,
  });

describe('GET /api/v1/users/me/decks/:deckId/cards', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const res = await request(app).get(url(deck._id));
      expect(res.status).toBe(401);
    });
  });

  describe('list', () => {
    it('returns cards sorted by order with pagination', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      await makeCard(deck._id, topic._id, { term: 'b', order: 2 });
      await makeCard(deck._id, topic._id, { term: 'a', order: 1 });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Cards retrieved successfully');
      expect(res.body.data.cards.map((c) => c.term)).toEqual(['a', 'b']);
      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        totalItems: 2,
        totalPages: 1,
      });
    });

    it('defaults to empty array when there are no cards', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cards).toEqual([]);
      expect(res.body.data.pagination.totalItems).toBe(0);
    });

    it('filters by topicId', async () => {
      const deck = await makeMyDeck();
      const topicA = await makeTopic(deck._id);
      const topicB = await makeTopic(deck._id);
      await makeCard(deck._id, topicA._id, { term: 'inA' });
      await makeCard(deck._id, topicB._id, { term: 'inB' });

      const res = await request(app)
        .get(`${url(deck._id)}?topicId=${topicB._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.cards).toHaveLength(1);
      expect(res.body.data.cards[0].term).toBe('inB');
    });

    it('searches by term (q)', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      await makeCard(deck._id, topic._id, { term: 'family' });
      await makeCard(deck._id, topic._id, { term: 'work', order: 2 });

      const res = await request(app)
        .get(`${url(deck._id)}?q=fam`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.cards).toHaveLength(1);
      expect(res.body.data.cards[0].term).toBe('family');
    });

    it('treats regex metacharacters in q literally (no ReDoS)', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      await makeCard(deck._id, topic._id, { term: 'a+b' });

      const res = await request(app)
        .get(`${url(deck._id)}?q=${encodeURIComponent('a+b')}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.cards).toHaveLength(1);
    });

    it('paginates with page and limit', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      for (let i = 1; i <= 5; i += 1) {
        await makeCard(deck._id, topic._id, { term: `c${i}`, order: i });
      }

      const res = await request(app)
        .get(`${url(deck._id)}?page=2&limit=2`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.cards).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        page: 2,
        limit: 2,
        totalItems: 5,
        totalPages: 3,
      });
      expect(res.body.data.cards.map((c) => c.term)).toEqual(['c3', 'c4']);
    });
  });

  describe('ownership / scoping', () => {
    it("returns 404 for another user's deck", async () => {
      const deck = await Deck.create({
        title: 'Other',
        slug: 'other-deck',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    it('does not leak cards from other decks', async () => {
      const deck = await makeMyDeck();
      const other = await Deck.create({
        title: 'Other',
        slug: 'other-deck',
        ownerType: 'user',
        ownerId: otherUserId,
        status: 'published',
      });
      const otherTopic = await Topic.create({
        deckId: other._id,
        name: 'X',
        slug: 'x',
        order: 1,
      });
      await makeCard(other._id, otherTopic._id, { term: 'secret' });

      const res = await request(app)
        .get(url(deck._id))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data.cards).toEqual([]);
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid deckId', async () => {
      const res = await request(app)
        .get(url('notanid'))
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'deckId' })])
      );
    });

    it('returns 400 for an invalid topicId filter', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .get(`${url(deck._id)}?topicId=notanid`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
    });
  });
});
