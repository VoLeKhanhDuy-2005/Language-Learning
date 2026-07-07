import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import * as controller from './battle.controller.js';

const router = Router();

router.get('/history', protect, controller.getHistory);
router.get('/:id', protect, controller.getMatch);

export default router;
