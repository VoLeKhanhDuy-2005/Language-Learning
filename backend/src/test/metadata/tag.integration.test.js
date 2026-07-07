import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Tag from '../../models/tag.model.js';
import Lesson from '../../models/lesson.model.js';
import Deck from '../../models/deck.model.js';

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
  await Promise.all([
    Tag.deleteMany({}),
    Lesson.deleteMany({}),
    Deck.deleteMany({}),
  ]);
});

const url = '/api/v1/tags';

describe('GET /api/v1/tags', () => {
  it('returns all tags sorted by label (no auth required)', async () => {
    await Tag.insertMany([
      { code: 'movie', label: 'Movie' },
      { code: 'daily', label: 'Daily life' },
    ]);

    const res = await request(app).get(url);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Tags retrieved successfully');
    expect(res.body.data.map((t) => t.label)).toEqual(['Daily life', 'Movie']);
  });

  it('returns empty array when there are no tags', async () => {
    const res = await request(app).get(url);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  describe('usedBy=lesson', () => {
    it('returns only tags used by published lessons', async () => {
      const tagA = await Tag.create({ code: 'a', label: 'A' });
      const tagB = await Tag.create({ code: 'b', label: 'B' });
      const tagUnused = await Tag.create({ code: 'c', label: 'C' });

      await Lesson.create({
        title: 'L1',
        slug: 'l1',
        sourceUrl: 'http://x',
        status: 'published',
        tagIds: [tagA._id],
      });
      // Draft lesson with tagB should NOT count.
      await Lesson.create({
        title: 'L2',
        slug: 'l2',
        sourceUrl: 'http://y',
        status: 'draft',
        tagIds: [tagB._id],
      });

      const res = await request(app).get(`${url}?usedBy=lesson`);

      expect(res.status).toBe(200);
      const codes = res.body.data.map((t) => t.code);
      expect(codes).toContain('a');
      expect(codes).not.toContain('b'); // draft lesson
      expect(codes).not.toContain('c'); // unused
      expect(res.body.data.map((t) => t._id)).not.toContain(
        tagUnused._id.toString()
      );
    });
  });

  describe('usedBy=deck', () => {
    it('returns only tags used by published system decks', async () => {
      const tagD = await Tag.create({ code: 'd', label: 'D' });
      const tagU = await Tag.create({ code: 'u', label: 'U' });

      await Deck.create({
        title: 'System Deck',
        slug: 'sys-deck',
        ownerType: 'system',
        status: 'published',
        tagIds: [tagD._id],
      });
      // User deck tag should NOT count.
      await Deck.create({
        title: 'User Deck',
        slug: 'user-deck',
        ownerType: 'user',
        ownerId: new mongoose.Types.ObjectId(),
        status: 'published',
        tagIds: [tagU._id],
      });

      const res = await request(app).get(`${url}?usedBy=deck`);

      expect(res.status).toBe(200);
      const codes = res.body.data.map((t) => t.code);
      expect(codes).toContain('d');
      expect(codes).not.toContain('u'); // user deck
    });
  });

  describe('input validation', () => {
    it('returns 400 for an invalid usedBy value', async () => {
      const res = await request(app).get(`${url}?usedBy=banana`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'usedBy' })])
      );
    });
  });
});
