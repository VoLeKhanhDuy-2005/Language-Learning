import { Router } from 'express';
import * as controller from './deck.controller.js';
import { protect, protectOptional } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protectOptional, controller.listDecks);
router.get('/:deckId', protect, controller.getDeckById);
router.get('/:deckId/topics', protect, controller.getDeckTopics);
router.get('/:deckId/topics/:topicId/cards', protect, controller.getTopicCards);

export default router;
