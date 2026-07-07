import { Router } from 'express';
import { responseQuestion, autoFillCard } from './ai.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(protect);
router.post('/response', responseQuestion);
router.post('/cards/auto-fill', autoFillCard);

export default router;
