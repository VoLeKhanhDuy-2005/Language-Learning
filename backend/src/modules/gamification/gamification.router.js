import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import * as controller from './gamification.controller.js';

const router = Router();

// Module 1 — Streak
router.get('/streak', protect, controller.getStreak);

// Module 2 — Profile + Leaderboard + Rank
router.get('/me', protect, controller.getMe);
router.get('/me/rank', protect, controller.getMyRank);
router.get('/leaderboard', protect, controller.getLeaderboard);

export default router;
