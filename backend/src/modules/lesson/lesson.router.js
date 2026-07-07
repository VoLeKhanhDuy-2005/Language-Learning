import { Router } from 'express';
import * as controller from './lesson.controller.js';
import { protect, protectOptional } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protectOptional, controller.listLessons);
router.get('/:lessonId', protect, controller.getLessonById);
router.get('/:lessonId/segments', protect, controller.getSegments);
router.get(
  '/:lessonId/segments/:segmentId',
  protect,
  controller.getSegmentById
);

export default router;
