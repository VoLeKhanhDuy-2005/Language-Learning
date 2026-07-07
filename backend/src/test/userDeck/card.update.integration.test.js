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

const makeTopic = (deckId, over = {}) =>
  Topic.create({
    deckId,
    name: over.name || 'T',
    slug: over.slug || `topic-${new mongoose.Types.ObjectId()}`,
    order: over.order ?? 1,
    cardCount: over.cardCount ?? 0,
  });

const makeCard = (deckId, topicId, over = {}) =>
  Card.create({
    deckId,
    topicId,
    term: over.term || 'family',
    translation: over.translation || 'gia đình',
    order: over.order ?? 1,
    pos: over.pos || '',
  });

describe('PUT /api/v1/users/me/decks/:deckId/cards/:cardId', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id);
      const res = await request(app)
        .put(url(deck._id, card._id))
        .send({ term: 'new' });
      expect(res.status).toBe(401);
    });
  });

  describe('update fields', () => {
    it('updates term and translation', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id);

      const res = await request(app)
        .put(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ term: 'work', translation: 'công việc' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Card updated successfully');
      expect(res.body.data.term).toBe('work');
      expect(res.body.data.translation).toBe('công việc');
    });

    it('maps definition -> explanation.vi and example -> examples.en', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id);

      const res = await request(app)
        .put(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ definition: 'Định nghĩa mới', example: 'New example.' });

      expect(res.status).toBe(200);
      expect(res.body.data.explanation.vi).toBe('Định nghĩa mới');
      expect(res.body.data.examples.en).toBe('New example.');
    });

    it('updates pos', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id, { pos: '' });

      const res = await request(app)
        .put(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ pos: 'verb' });

      expect(res.body.data.pos).toBe('verb');
    });
  });

  describe('topic is immutable', () => {
    it('ignores topicId in the body (no topic move)', async () => {
      const deck = await makeMyDeck();
      const topicA = await makeTopic(deck._id, { name: 'A', cardCount: 1 });
      const topicB = await makeTopic(deck._id, {
        name: 'B',
        order: 2,
        cardCount: 0,
      });
      const card = await makeCard(deck._id, topicA._id, { order: 1 });

      const res = await request(app)
        .put(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ term: 'renamed', topicId: topicB._id });

      expect(res.status).toBe(200);
      expect(res.body.data.term).toBe('renamed');
      expect(res.body.data.topicId).toBe(topicA._id.toString()); // unchanged

      const [a, b] = await Promise.all([
        Topic.findById(topicA._id),
        Topic.findById(topicB._id),
      ]);
      expect(a.cardCount).toBe(1); // counts untouched
      expect(b.cardCount).toBe(0);
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
        .put(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ term: 'hacked' });

      expect(res.status).toBe(404);
      const inDb = await Card.findById(card._id);
      expect(inDb.term).toBe('family');
    });

    it('returns 404 when the card is in a different deck', async () => {
      const deckA = await makeMyDeck();
      const deckB = await makeMyDeck();
      const topicB = await makeTopic(deckB._id);
      const cardInB = await makeCard(deckB._id, topicB._id);

      const res = await request(app)
        .put(url(deckA._id, cardInB._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ term: 'x' });

      expect(res.status).toBe(404);
    });
  });

  describe('input validation', () => {
    it('returns 400 when no field is provided', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id);

      const res = await request(app)
        .put(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 for an invalid cardId', async () => {
      const deck = await makeMyDeck();
      const res = await request(app)
        .put(url(deck._id, 'notanid'))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ term: 'x' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'cardId' })])
      );
    });

    it('ignores attempts to change deckId/order (mass-assignment)', async () => {
      const deck = await makeMyDeck();
      const topic = await makeTopic(deck._id);
      const card = await makeCard(deck._id, topic._id, { order: 1 });

      const res = await request(app)
        .put(url(deck._id, card._id))
        .set('Authorization', `Bearer ${validToken}`)
        .send({ term: 'renamed', order: 99, deckId: otherUserId });

      expect(res.status).toBe(200);
      expect(res.body.data.order).toBe(1);
      expect(res.body.data.deckId).toBe(deck._id.toString());
    });
  });
});
