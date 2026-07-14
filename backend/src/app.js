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
import testRouter from './modules/test/test.router.js';

const app = express();

app.set('trust proxy', 1); // Trust reverse proxy (Render, Vercel, Heroku, etc.)

// Hỗ trợ nhiều origin (dùng dấu phẩy trong CLIENT_URL)
const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:4173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (ví dụ: curl, server-side)
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      const normalizedAllowedOrigins = allowedOrigins.map(o => o.replace(/\/$/, ''));
      if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' không được phép`));
      }
    },
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

// Router test-only: chỉ mount khi NODE_ENV=test, tuyệt đối không dùng trên production
if (process.env.NODE_ENV === 'test') {
  app.use('/api/v1/test', testRouter);
}

// Global Error Handler
app.use(errorLogger);
app.use(errorHandler);

export default app;
