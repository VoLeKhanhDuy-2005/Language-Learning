import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/user.model.js';
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
  testUser = await User.create({
    name: 'Profile User',
    email: 'profile@example.com',
    passwordHash: 'dummyhash',
    isVerified: true,
  });
  token = generateToken(
    { id: testUser._id, role: 'user', type: 'ACCESS' },
    '1h'
  );
});

const url = `/api/v1/users/me/profile-update`;

describe('PATCH /users/me/profile-update', () => {
  it('updates the user profile successfully', async () => {
    const payload = {
      name: 'Updated Name',
    };

    const res = await request(app)
      .patch(url)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');

    const dbUser = await User.findById(testUser._id);
    expect(dbUser.name).toBe('Updated Name');
  });

  it('returns 401 if not authenticated', async () => {
    const res = await request(app).patch(url).send({ name: 'Update' });

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid data', async () => {
    const res = await request(app)
      .patch(url)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' }); // empty name not allowed

    expect(res.status).toBe(400);
  });
});
