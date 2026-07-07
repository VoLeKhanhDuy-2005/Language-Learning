import { Router } from 'express';
import * as controller from './userDeck.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, controller.listMyDecks);
router.post('/', protect, controller.createDeck);
router.get('/:deckId', protect, controller.getMyDeckById);
router.put('/:deckId', protect, controller.updateMyDeck);
router.delete('/:deckId', protect, controller.deleteMyDeck);

// Topics
router.get('/:deckId/topics', protect, controller.getMyDeckTopics);
router.post('/:deckId/topics', protect, controller.createMyDeckTopic);
router.get('/:deckId/topics/:topicId', protect, controller.getMyDeckTopic);
router.put('/:deckId/topics/:topicId', protect, controller.updateMyDeckTopic);
router.delete(
  '/:deckId/topics/:topicId',
  protect,
  controller.deleteMyDeckTopic
);

// Cards
router.get('/:deckId/cards', protect, controller.listMyDeckCards);
router.post('/:deckId/cards', protect, controller.createMyDeckCard);
router.get('/:deckId/cards/:cardId', protect, controller.getMyDeckCard);
router.put('/:deckId/cards/:cardId', protect, controller.updateMyDeckCard);
router.delete('/:deckId/cards/:cardId', protect, controller.deleteMyDeckCard);

router.get('/:deckId/topics/:topicId/export', protect, controller.exportCards);
router.post('/:deckId/topics/:topicId/import', protect, controller.importCards);

export default router;
