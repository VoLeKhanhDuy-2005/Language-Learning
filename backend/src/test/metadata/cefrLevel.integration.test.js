import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import CefrLevel from '../../models/cefrLevel.model.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await CefrLevel.deleteMany({});
});

const url = '/api/v1/cefr-levels';

describe('GET /api/v1/cefr-levels', () => {
  it('returns all levels sorted by code (no auth required)', async () => {
    await CefrLevel.insertMany([
      { code: 'b1', label: 'B1' },
      { code: 'a1', label: 'A1' },
      { code: 'a2', label: 'A2' },
    ]);

    const res = await request(app).get(url);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('CEFR levels retrieved successfully');
    expect(res.body.data.map((l) => l.code)).toEqual(['a1', 'a2', 'b1']);
  });

  it('returns an empty array when there are none', async () => {
    const res = await request(app).get(url);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
