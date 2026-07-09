import { Router } from 'express';
import {
  responseQuestion,
  autoFillCard,
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  renameConversation,
} from './ai.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(protect);
router.post('/response', responseQuestion);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId', getConversation);
router.delete('/conversations/:conversationId', deleteConversation);
router.patch('/conversations/:conversationId/title', renameConversation);

router.post('/cards/auto-fill', autoFillCard);

export default router;
