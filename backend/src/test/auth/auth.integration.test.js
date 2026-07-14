import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import app from '../../app.js';
import User from '../../models/user.model.js';
import * as mailUtils from '../../utils/mail.util.js';

let mongod;
let hashedPass;

// Mock mail utility methods so we don't send real emails
vi.mock('../../utils/mail.util.js', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(true),
  sendForgotPasswordEmail: vi.fn().mockResolvedValue(true),
}));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  hashedPass = await bcrypt.hash('Password123!', 10);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  vi.clearAllMocks();
});

const url = (path) => `/api/v1/auth${path}`;

describe('Auth Module Integration', () => {
  describe('POST /auth/signup', () => {
    it('creates a new user and returns user info without password', async () => {
      const payload = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const res = await request(app).post(url('/signup')).send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe(payload.email);
      expect(res.body.data.user.name).toBe(payload.name);
      expect(res.body.data.user.password).toBeUndefined();

      // Ensure user was saved in DB
      const dbUser = await User.findOne({ email: payload.email });
      expect(dbUser).not.toBeNull();
      expect(dbUser.isVerified).toBeFalsy();
    });

    it('returns 400 if email already exists', async () => {
      const payload = {
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'Password123!',
      };

      // Create user first
      await request(app).post(url('/signup')).send(payload);

      // Try again
      const res = await request(app).post(url('/signup')).send(payload);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('returns 400 if validation fails', async () => {
      const payload = {
        name: '',
        email: 'invalidemail',
        password: '123', // too short
      };

      const res = await request(app).post(url('/signup')).send(payload);
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login User',
        email: 'login@example.com',
        passwordHash: hashedPass,
        isVerified: true, // Needs to be true to login without 403
      });
    });

    it('logs in successfully and returns tokens', async () => {
      const res = await request(app).post(url('/login')).send({
        email: 'login@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('login@example.com');
      // check cookie for refresh token
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=');
    });

    it('returns 400 for incorrect password', async () => {
      const res = await request(app).post(url('/login')).send({
        email: 'login@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 400 for non-existent email', async () => {
      const res = await request(app).post(url('/login')).send({
        email: 'notfound@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /auth/verify-email/send', () => {
    it('sends an OTP email', async () => {
      await User.create({
        name: 'Verify User',
        email: 'verify@example.com',
        passwordHash: hashedPass,
        isVerified: false,
      });

      const res = await request(app).post(url('/verify-email/send')).send({
        email: 'verify@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('VERIFICATION_EMAIL_SENT');
      expect(mailUtils.sendOtpEmail).toHaveBeenCalledWith(
        'verify@example.com',
        expect.any(String) // Miễn là một chuỗi thì test sẽ pass
      );
    });

    it('returns 404 if email not found', async () => {
      const res = await request(app).post(url('/verify-email/send')).send({
        email: 'notfound@example.com',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('verifies the email with correct OTP', async () => {
      await User.create({
        name: 'Verify User',
        email: 'verify2@example.com',
        passwordHash: hashedPass,
        isVerified: false,
      });

      // Send OTP to put it in Redis
      await request(app).post(url('/verify-email/send')).send({
        email: 'verify2@example.com',
      });

      // Grab the OTP from the mock call
      const otp = mailUtils.sendOtpEmail.mock.calls[0][1];

      // Now verify
      const res = await request(app).post(url('/verify-email')).send({
        email: 'verify2@example.com',
        otp,
      });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('EMAIL_VERIFIED');

      const dbUser = await User.findOne({ email: 'verify2@example.com' });
      expect(dbUser.isVerified).toBe(true);
    });

    it('returns 400 for incorrect OTP', async () => {
      await User.create({
        name: 'Verify User',
        email: 'verify3@example.com',
        passwordHash: hashedPass,
        isVerified: false,
      });

      await request(app).post(url('/verify-email/send')).send({
        email: 'verify3@example.com',
      });

      const res = await request(app).post(url('/verify-email')).send({
        email: 'verify3@example.com',
        otp: '000000', // Assuming this is wrong
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OTP');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('sends password reset email', async () => {
      await User.create({
        name: 'Forgot User',
        email: 'forgot@example.com',
        passwordHash: hashedPass,
        isVerified: true,
      });

      const res = await request(app).post(url('/forgot-password')).send({
        email: 'forgot@example.com',
      });

      expect(res.status).toBe(200);
      expect(mailUtils.sendForgotPasswordEmail).toHaveBeenCalledWith(
        'forgot@example.com',
        expect.any(String)
      );
    });
  });

  describe('POST /auth/reset-password', () => {
    it('resets the password with correct OTP', async () => {
      await User.create({
        name: 'Reset User',
        email: 'reset@example.com',
        passwordHash: hashedPass,
        isVerified: true,
      });

      await request(app).post(url('/forgot-password')).send({
        email: 'reset@example.com',
      });

      const otp = mailUtils.sendForgotPasswordEmail.mock.calls[0][1];

      const res = await request(app).post(url('/reset-password')).send({
        email: 'reset@example.com',
        otp,
        newPassword: 'NewPassword123!',
      });

      expect(res.status).toBe(200);

      // Attempt login with new password
      const loginRes = await request(app).post(url('/login')).send({
        email: 'reset@example.com',
        password: 'NewPassword123!',
      });
      expect(loginRes.status).toBe(200);
    });
  });
});
