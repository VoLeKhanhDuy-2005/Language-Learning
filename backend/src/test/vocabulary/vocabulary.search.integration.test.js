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

const url = '/api/v1/vocabulary/search';

const makeSystemDeck = (over = {}) =>
  Deck.create({
    title: 'System',
    slug: `sys-${new mongoose.Types.ObjectId()}`,
    ownerType: 'system',
    status: over.status || 'published',
    ...over,
  });

const makeCard = (deckId, over = {}) =>
  Card.create({
    deckId,
    topicId: new mongoose.Types.ObjectId(),
    term: over.term || 'family',
    translation: over.translation || 'gia đình',
    order: over.order ?? 1,
    pos: over.pos || 'noun',
    explanation: { vi: over.definition || 'Người thân', en: '' },
    examples: { vi: '', en: over.example || 'My family is big.' },
  });

describe('GET /api/v1/vocabulary/search', () => {
  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get(`${url}?q=family`);
      expect(res.status).toBe(401);
    });
  });

  describe('search', () => {
    it('finds system cards by term and maps the prefill shape', async () => {
      const deck = await makeSystemDeck();
      await makeCard(deck._id, {
        term: 'family',
        translation: 'gia đình',
        pos: 'noun',
        definition: 'Người thân',
        example: 'My family is big.',
      });

      const res = await request(app)
        .get(`${url}?q=fam`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Vocabulary search successful');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        term: 'family',
        translation: 'gia đình',
        pos: 'noun',
        definition: 'Người thân',
        example: 'My family is big.',
      });
      expect(res.body.data[0].sourceCardId).toBeDefined();
    });

    it('is case-insensitive', async () => {
      const deck = await makeSystemDeck();
      await makeCard(deck._id, { term: 'Family' });

      const res = await request(app)
        .get(`${url}?q=FAMILY`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data).toHaveLength(1);
    });

    it('returns an empty array when nothing matches', async () => {
      const deck = await makeSystemDeck();
      await makeCard(deck._id, { term: 'family' });

      const res = await request(app)
        .get(`${url}?q=zzz`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('excludes user-owned deck cards', async () => {
      const userDeck = await Deck.create({
        title: 'Mine',
        slug: 'mine',
        ownerType: 'user',
        ownerId: testUserId,
        status: 'published',
      });
      await makeCard(userDeck._id, { term: 'family' });

      const res = await request(app)
        .get(`${url}?q=family`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data).toEqual([]);
    });

    it('excludes non-published system decks', async () => {
      const draft = await makeSystemDeck({
        status: 'draft',
        slug: 'draft-sys',
      });
      await makeCard(draft._id, { term: 'family' });

      const res = await request(app)
        .get(`${url}?q=family`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data).toEqual([]);
    });

    it('treats regex metacharacters literally (no ReDoS)', async () => {
      const deck = await makeSystemDeck();
      await makeCard(deck._id, { term: 'a+b' });

      const res = await request(app)
        .get(`${url}?q=${encodeURIComponent('a+b')}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data).toHaveLength(1);
    });

    it('respects the limit param', async () => {
      const deck = await makeSystemDeck();
      for (let i = 0; i < 5; i += 1) {
        await makeCard(deck._id, { term: `word${i}`, order: i });
      }

      const res = await request(app)
        .get(`${url}?q=word&limit=2`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('input validation', () => {
    it('returns 400 when q is missing', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'q' })])
      );
    });

    it('returns 400 when q is empty/whitespace', async () => {
      const res = await request(app)
        .get(`${url}?q=${encodeURIComponent('   ')}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
    });
  });
});
