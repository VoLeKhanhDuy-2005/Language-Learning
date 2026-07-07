import { Router } from 'express';
import * as controller from './file.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/presigned-url', protect, controller.createPresignedUrl);

export default router;
