import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import * as controller from './user.controller.js';

const router = Router();
router.use(protect);
router.get(
  '/me/lessons/:lessonId/segments-progress',
  controller.getLessonSegmentsProgress
);
router.get(
  '/me/lessons/:lessonId/segments/:segmentId/progress',
  controller.getSegmentProgress
);
router.patch(
  '/me/lessons/:lessonId/segments/:segmentId/progress',
  controller.updateSegmentProgress
);

router.get('/me/card-states', controller.getCardStates);
router.get('/me/card-states/:cardId', controller.getCardState);
router.patch('/me/card-states/:cardId', controller.upsertCardState);

router.patch('/me/profile-update', controller.updateProfile);

router.get('/me/stats', controller.getUserStats);

export default router;
