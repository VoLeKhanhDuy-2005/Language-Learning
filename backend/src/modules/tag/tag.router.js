import { Router } from 'express';
import * as controller from './tag.controller.js';

const router = Router();

// Public metadata for lesson/deck filters. Optional ?usedBy=lesson|deck.
router.get('/', controller.listTags);

export default router;
