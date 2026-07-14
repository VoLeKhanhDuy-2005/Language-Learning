import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/user.model.js';
import UserCardState from '../../models/userCardState.model.js';
import XpEvent from '../../models/xpEvent.model.js';
import { generateToken } from '../../utils/jwt.js';

let mongod;
let testUser;
let token;

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
  await XpEvent.deleteMany({});

  testUser = await User.create({
    name: 'Stats User',
    email: 'stats@example.com',
    passwordHash: 'dummyhash',
    isVerified: true,
  });
  token = generateToken(
    { id: testUser._id, role: 'user', type: 'ACCESS' },
    '1h'
  );
});

const url = `/api/v1/users/me/stats`;

describe('GET /users/me/stats', () => {
  it('returns user stats with correct values', async () => {
    const deckId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();

    await UserCardState.create({
      userId: testUser._id,
      deckId,
      topicId,
      cardId: new mongoose.Types.ObjectId(),
      srs: {
        lastGrade: 0,
        nextReviewAt: new Date(),
      },
    });

    await UserCardState.create({
      userId: testUser._id,
      deckId,
      topicId,
      cardId: new mongoose.Types.ObjectId(),
      srs: {
        lastGrade: 2,
        nextReviewAt: new Date(),
      },
    });

    await UserCardState.create({
      userId: testUser._id,
      deckId,
      topicId,
      cardId: new mongoose.Types.ObjectId(),
      srs: {
        lastGrade: 4,
        nextReviewAt: new Date(Date.now() + 86400000), // tomorrow
      },
    });

    // Mock XP
    await XpEvent.create({
      userId: testUser._id,
      amount: 15,
      source: 'card_review',
    });

    await XpEvent.create({
      userId: testUser._id,
      amount: 20,
      source: 'segment_complete',
    });

    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.learnedLessons).toBe(0);
    expect(res.body.data.reviewedCards).toBe(3);
  });

  it('returns 401 if not authenticated', async () => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
  });
});
