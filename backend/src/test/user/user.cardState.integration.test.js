import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/user.model.js';
import UserCardState from '../../models/userCardState.model.js';
import Card from '../../models/card.model.js';
import { generateToken } from '../../utils/jwt.js';

let mongod;
let testUser;
let token;

const deckId = new mongoose.Types.ObjectId();
const topicId = new mongoose.Types.ObjectId();

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
  await UserCardState.deleteMany({});
  await Card.deleteMany({});

  testUser = await User.create({
    name: 'CardState User',
    email: 'cardstate@example.com',
    passwordHash: 'dummyhash',
    isVerified: true,
  });
  token = generateToken(
    { id: testUser._id, role: 'user', type: 'ACCESS' },
    '1h'
  );
});

const urlBase = `/api/v1/users/me/card-states`;

describe('Card State Integration', () => {
  describe('GET /users/me/card-states', () => {
    it('returns a list of card states', async () => {
      const card = await Card.create({
        deckId,
        topicId,
        term: 'apple',
        definition: 'quả táo',
        translation: 'translation',
        order: 1,
      });
      const cardId = card._id;

      await UserCardState.create({
        userId: testUser._id,
        deckId,
        topicId,
        cardId,
        srs: {
          lastGrade: 0,
          interval: 0,
          nextReviewAt: new Date(),
        },
      });

      const res = await request(app)
        .get(urlBase)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].srs.lastGrade).toBe(0);
    });

    it('filters due cards', async () => {
      const card1 = await Card.create({
        deckId,
        topicId,
        term: 'a',
        definition: 'b',
        translation: 't',
        order: 1,
      });
      const cardId1 = card1._id;
      const card2 = await Card.create({
        deckId,
        topicId,
        term: 'c',
        definition: 'd',
        translation: 't',
        order: 2,
      });
      const cardId2 = card2._id;

      // Due card
      await UserCardState.create({
        userId: testUser._id,
        deckId,
        topicId,
        cardId: cardId1,
        srs: {
          lastGrade: 1,
          nextReviewAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
      });

      // Not due card
      await UserCardState.create({
        userId: testUser._id,
        deckId,
        topicId,
        cardId: cardId2,
        srs: {
          lastGrade: 1,
          nextReviewAt: new Date(Date.now() + 86400000), // tomorrow
        },
      });

      const res = await request(app)
        .get(`${urlBase}?due=true`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].cardId._id).toBe(cardId1.toString());
    });
  });

  describe('GET /users/me/card-states/:cardId', () => {
    it('returns detail of a specific card state', async () => {
      const card = await Card.create({
        deckId,
        topicId,
        term: 'a',
        definition: 'b',
        translation: 't',
        order: 1,
      });
      const cardId = card._id;

      await UserCardState.create({
        userId: testUser._id,
        deckId,
        topicId,
        cardId,
        srs: {
          lastGrade: 3,
          nextReviewAt: new Date(),
        },
      });

      const res = await request(app)
        .get(`${urlBase}/${cardId.toString()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.srs.lastGrade).toBe(3);
    });

    it('returns 404 if state does not exist', async () => {
      const card = await Card.create({
        deckId,
        topicId,
        term: 'a',
        definition: 'b',
        translation: 't',
        order: 1,
      });
      const cardId = card._id;
      const res = await request(app)
        .get(`${urlBase}/${cardId.toString()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('CARD_STATE_NOT_FOUND');
    });
  });

  describe('PATCH /users/me/card-states/:cardId', () => {
    it('creates a new card state if it does not exist', async () => {
      const card = await Card.create({
        deckId,
        topicId,
        term: 'a',
        definition: 'b',
        translation: 't',
        order: 1,
      });
      const cardId = card._id;
      const payload = {
        deckId: deckId.toString(),
        topicId: topicId.toString(),
        srs: {
          lastGrade: 1,
        },
      };

      const res = await request(app)
        .patch(`${urlBase}/${cardId.toString()}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.data.srs.lastGrade).toBe(1);

      const dbState = await UserCardState.findOne({
        userId: testUser._id,
        cardId,
      });
      expect(dbState).not.toBeNull();
      expect(dbState.srs.lastGrade).toBe(1);
    });

    it('updates an existing card state', async () => {
      const card = await Card.create({
        deckId,
        topicId,
        term: 'a',
        definition: 'b',
        translation: 't',
        order: 1,
      });
      const cardId = card._id;
      await UserCardState.create({
        userId: testUser._id,
        deckId,
        topicId,
        cardId,
        srs: {
          lastGrade: 0,
          nextReviewAt: new Date(),
        },
      });

      const payload = {
        srs: {
          lastGrade: 3,
        },
      };

      const res = await request(app)
        .patch(`${urlBase}/${cardId.toString()}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.data.srs.lastGrade).toBe(3);

      const dbState = await UserCardState.findOne({
        userId: testUser._id,
        cardId,
      });
      expect(dbState.srs.lastGrade).toBe(3);
    });
  });
});
