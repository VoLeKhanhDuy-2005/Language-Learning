import cookieParser from 'cookie-parser';
import gamificationRouter from './modules/gamification/gamification.router.js';
import battleRouter from './modules/battle/battle.router.js';
import vocabularyRouter from './modules/vocabulary/vocabulary.router.js';
import lessonRouter from './modules/lesson/lesson.router.js';
import deckRouter from './modules/deck/deck.router.js';
import userDeckRouter from './modules/userDeck/userDeck.router.js';
import cefrLevelRouter from './modules/cefrLevel/cefrLevel.router.js';
import tagRouter from './modules/tag/tag.router.js';
import fileRouter from './modules/file/file.router.js';
import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/errorHandler.js';
import errorLogger from './middlewares/errorLogger.js';
import requestLogger from './middlewares/requestLogger.js';
import authRouter from './modules/auth/auth.router.js';
import aiRouter from './modules/ai/ai.routes.js';
import adminRouter from './modules/admin/admin.router.js';
import userRouter from './modules/user/user.router.js';
import swaggerUi from 'swagger-ui-express';
import openapiDocument from './config/openapi/index.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Routes
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
}
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/lessons', lessonRouter);
app.use('/api/v1/decks', deckRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/users/me/decks', userDeckRouter);
app.use('/api/v1/cefr-levels', cefrLevelRouter);
app.use('/api/v1/tags', tagRouter);
app.use('/api/v1/s3', fileRouter);
app.use('/api/v1/gamification', gamificationRouter);
app.use('/api/v1/vocabulary', vocabularyRouter);
app.use('/api/v1/battle', battleRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/admin', adminRouter);

// Global Error Handler
app.use(errorLogger);
app.use(errorHandler);

export default app;
