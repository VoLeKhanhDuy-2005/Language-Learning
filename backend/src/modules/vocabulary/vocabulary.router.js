import { Router } from 'express';
import * as controller from './vocabulary.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/search', protect, controller.searchVocabulary);
router.get('/states', protect, controller.getUserCardStates);

export default router;
