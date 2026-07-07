import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import * as adminController from './admin.controller.js';

const router = Router();
router.use(protect);
router.use(authorize('admin'));
router.get('/dashboard', adminController.getDashboardMetrics);
router.get('/tags', adminController.listTags);
router.post('/tags', adminController.createTag);
router.get('/tags/:id', adminController.getTagById);
router.put('/tags/:id', adminController.updateTag);
router.delete('/tags/:id', adminController.deleteTag);

router.get('/decks', adminController.listDecks);
router.post('/decks', adminController.createDeck);
router.get('/decks/:id', adminController.getDeckById);
router.put('/decks/:id', adminController.updateDeck);
router.delete('/decks/:id', adminController.deleteDeck);

router.get('/decks/:deckId/topics', adminController.getDeckTopics);
router.post('/decks/:deckId/topics', adminController.createDeckTopic);
router.get('/decks/:deckId/topics/:topicId', adminController.getDeckTopicById);
router.put('/decks/:deckId/topics/:topicId', adminController.updateDeckTopic);
router.delete('/decks/:deckId/topics', adminController.deleteMultipleDeckTopics);
router.delete('/decks/:deckId/topics/:topicId', adminController.deleteDeckTopic);
router.patch('/decks/:deckId/topics/reorder', adminController.reorderDeckTopics);

router.get('/decks/:deckId/cards', adminController.listDeckCards);
router.post('/decks/:deckId/cards', adminController.createDeckCard);
router.get('/decks/:deckId/cards/:cardId', adminController.getDeckCardById);
router.put('/decks/:deckId/cards/:cardId', adminController.updateDeckCard);
router.delete('/decks/:deckId/cards', adminController.deleteMultipleDeckCards);
router.delete('/decks/:deckId/cards/:cardId', adminController.deleteDeckCard);
router.patch('/topics/:topicId/cards/reorder', adminController.reorderTopicCards);

router.get('/lessons', adminController.listLessons);
router.post('/lessons', adminController.createLesson);
router.get('/lessons/:lessonId', adminController.getLessonById);
router.put('/lessons/:lessonId', adminController.updateLesson);
router.delete('/lessons/:lessonId', adminController.deleteLesson);

router.get('/lessons/:lessonId/segments', adminController.listLessonSegments);
router.post('/lessons/:lessonId/segments', adminController.createLessonSegment);
router.get(
  '/lessons/:lessonId/segments/:segmentId',
  adminController.getLessonSegmentById
);
router.put(
  '/lessons/:lessonId/segments/:segmentId',
  adminController.updateLessonSegment
);
router.delete('/lessons/:lessonId/segments', adminController.deleteMultipleLessonSegments);
router.delete(
  '/lessons/:lessonId/segments/:segmentId',
  adminController.deleteLessonSegment
);

router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUserById);
router.patch('/users/:userId', adminController.changeUserPassword);
router.patch('/users/:userId/status', adminController.changeUserStatus);

router.get(
  '/decks/:deckId/topics/:topicId/export',
  adminController.exportCards
);
router.post(
  '/decks/:deckId/topics/:topicId/import',
  adminController.importCards
);

export default router;
