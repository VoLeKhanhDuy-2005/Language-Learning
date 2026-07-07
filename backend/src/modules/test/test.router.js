import express from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/user.model.js';
import redisClient from '../../config/redis.js';

const router = express.Router();

/**
 * POST /api/v1/test/seed
 * Tạo các user test cần thiết cho E2E. Chỉ hoạt động khi NODE_ENV=test.
 * Idempotent: có thể gọi nhiều lần mà không bị lỗi.
 */
router.post('/seed', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);

    const users = [
      {
        email: 'test_e2e_user@example.com',
        password: '123456',
        name: 'Test E2E User',
        role: 'user',
      },
      {
        email: 'admin_e2e_user@example.com',
        password: '123456',
        name: 'E2E Admin User',
        role: 'admin',
      },
    ];

    const results = [];
    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password, salt);
      const result = await User.findOneAndUpdate(
        { email: u.email },
        {
          $set: {
            email: u.email,
            passwordHash,
            name: u.name,
            role: u.role,
            isVerified: true,
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ email: result.email, role: result.role });
    }

    res.json({ success: true, seeded: results });
  } catch (error) {
    console.error('[E2E Seed] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/test/otp/:email
 * Đọc mã OTP xác thực email từ Redis. Chỉ hoạt động khi NODE_ENV=test.
 * Dùng cho signup.e2e.test.js
 */
router.get('/otp/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const redisKey = `otp:verify_email:${email}`;
    const otp = await redisClient.get(redisKey);
    if (!otp) {
      return res.status(404).json({ success: false, otp: null });
    }
    res.json({ success: true, otp });
  } catch (error) {
    console.error('[E2E OTP] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/v1/test/cleanup
 * Xóa toàn bộ dữ liệu do E2E test tạo ra khỏi DB. Chỉ hoạt động khi NODE_ENV=test.
 * Gọi trong globalSetup teardown() để giữ DB E2E sạch sau mỗi lần chạy test.
 */
router.delete('/cleanup', async (req, res) => {
  try {
    // Xóa 2 user seed cố định
    const seedEmails = [
      'test_e2e_user@example.com',
      'admin_e2e_user@example.com',
    ];

    // Xóa các user đăng ký tạm trong các E2E test
    const result = await User.deleteMany({
      $or: [
        { email: { $in: seedEmails } },
        { email: /^e2e_(user|battle)_\d+@example\.com$/ },
      ],
    });

    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('[E2E Cleanup] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
