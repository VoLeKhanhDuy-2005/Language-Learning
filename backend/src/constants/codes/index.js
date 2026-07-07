import { COMMON, COMMON_MESSAGES } from './common.codes.js';
import { AUTH, AUTH_MESSAGES } from './auth.codes.js';
import { CEFR, CEFR_MESSAGES } from './cefr.codes.js';
import { TAG, TAG_MESSAGES } from './tag.codes.js';
import { LESSON, LESSON_MESSAGES } from './lesson.codes.js';
import { FILE, FILE_MESSAGES } from './file.codes.js';
import { DECK, DECK_MESSAGES } from './deck.codes.js';
import { USER_DECK, USER_DECK_MESSAGES } from './userDeck.codes.js';
import { VOCABULARY, VOCABULARY_MESSAGES } from './vocabulary.codes.js';
import { ADMIN, ADMIN_MESSAGES } from './admin.codes.js';
import {
  USER_CARD_STATE,
  USER_CARD_STATE_MESSAGES,
} from './userCardState.codes.js';
import { GAMIFICATION, GAMIFICATION_MESSAGES } from './gamification.codes.js';
import { BATTLE, BATTLE_MESSAGES } from './battle.codes.js';
import {
  USER_SEGMENT_PROGRESS,
  USER_SEGMENT_PROGRESS_MESSAGES,
} from './userSegmentProgress.codes.js';
import { USER, USER_MESSAGES } from './user.codes.js';
import { AI, AI_MESSAGES } from './ai.codes.js';

export {
  COMMON,
  AUTH,
  CEFR,
  TAG,
  LESSON,
  FILE,
  DECK,
  USER_DECK,
  VOCABULARY,
  ADMIN,
  USER_CARD_STATE,
  GAMIFICATION,
  BATTLE,
  USER_SEGMENT_PROGRESS,
  USER,
  AI,
};

export const MESSAGES = {
  ...COMMON_MESSAGES,
  ...AUTH_MESSAGES,
  ...CEFR_MESSAGES,
  ...TAG_MESSAGES,
  ...LESSON_MESSAGES,
  ...FILE_MESSAGES,
  ...DECK_MESSAGES,
  ...USER_DECK_MESSAGES,
  ...VOCABULARY_MESSAGES,
  ...ADMIN_MESSAGES,
  ...USER_CARD_STATE_MESSAGES,
  ...GAMIFICATION_MESSAGES,
  ...BATTLE_MESSAGES,
  ...USER_SEGMENT_PROGRESS_MESSAGES,
  ...USER_MESSAGES,
  ...AI_MESSAGES,
};
