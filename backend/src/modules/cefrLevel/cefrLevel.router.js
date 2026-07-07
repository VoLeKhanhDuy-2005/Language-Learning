import { Router } from 'express';
import * as controller from './cefrLevel.controller.js';

const router = Router();

router.get('/', controller.listCefrLevels);

export default router;
