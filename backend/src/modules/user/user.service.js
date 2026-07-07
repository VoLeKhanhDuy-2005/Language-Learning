import UserSegmentProgress from '../../models/userSegmentProgress.model.js';
import LessonSegment from '../../models/lessonSegment.model.js';
import Lesson from '../../models/lesson.model.js';
import UserCardState from '../../models/userCardState.model.js';
import UserLessonProgress from '../../models/userLessonProgress.model.js';
import User from '../../models/user.model.js';
import bcrypt from 'bcrypt';
import redisClient from '../../config/redis.js';
import { validateMediaUrl } from '../file/file.service.js';
import AppError from '../../utils/AppError.js';
import { config } from '../../config/env.js';
import {
  USER_CARD_STATE,
  LESSON,
  USER_SEGMENT_PROGRESS,
  COMMON,
  ADMIN,
  USER,
} from '../../constants/codes/index.js';
import { calculateNextSRS } from '../../utils/srs.util.js';
import { generateQuizOptions, generateQuizOptionsBatch } from '../deck/deck.service.js';
import { recordActivity } from '../gamification/gamification.service.js';
import { segmentXp, getDayKey } from '../../config/gamification.config.js';
import { sendChangePasswordEmail, sendBanEmail } from '../../utils/mail.util.js';
//import fs from 'fs';

export const evaluatePronunciation = async (audioUrl, referenceText) => {
  try {
    if (!config.azureSpeechKey || !config.azureSpeechRegion) {
      console.warn(
        'Azure Speech API keys not configured. Returning default score 0.'
      );
      return { score: 0, displayText: '', wordsAccuracy: {} };
    }

    // 1. Fetch audio từ URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error('Failed to fetch audio from:', audioUrl);
      return { score: 0, displayText: '', wordsAccuracy: {} };
    }
    const audioBuffer = await audioResponse.arrayBuffer();

    // 2. Chuẩn bị tham số đánh giá phát âm
    const assessmentParams = {
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
    };
    const pronunciationAssessmentHeader = Buffer.from(
      JSON.stringify(assessmentParams)
    ).toString('base64');

    // 3. POST request to Azure REST API
    const endpoint = `https://${config.azureSpeechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
    const azureResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.azureSpeechKey,
        Accept: 'application/json',
        'Content-Type': 'audio/wav',
        'Pronunciation-Assessment': pronunciationAssessmentHeader,
      },
      body: audioBuffer,
    });
    if (!azureResponse.ok) {
      const errText = await azureResponse.text();
      //console.error('Azure API Error:', errText);
      return { score: 0, displayText: '', wordsAccuracy: {} }; // Return 0 khi fail để không crash app
    }
    const result = await azureResponse.json();

    if (result.NBest && result.NBest.length > 0) {
      const best = result.NBest[0];
      const pronScore =
        best.PronScore !== undefined
          ? best.PronScore
          : best.PronunciationAssessment
            ? best.PronunciationAssessment.PronScore
            : undefined;

      const displayText = best.Display || '';
      const wordsAccuracy = {};
      if (best.Words) {
        best.Words.forEach((w) => {
          wordsAccuracy[w.Word] = w.AccuracyScore;
        });
      }

      // fs.writeFileSync(
      //   'speech-result.json',
      //   JSON.stringify(result, null, 2),
      //   'utf8'
      // );

      if (pronScore !== undefined) {
        return {
          score: pronScore,
          displayText,
          wordsAccuracy,
        };
      }
    }
    return { score: 0, displayText: '', wordsAccuracy: {} };
  } catch (error) {
    //console.error('[AzureSpeech] Error in evaluatePronunciation:', error);
    return { score: 0, displayText: '', wordsAccuracy: {} };
  }
};

export const getLessonSegmentsProgress = async (userId, lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  }
  return await UserSegmentProgress.find({ userId, lessonId });
};

export const getSegmentProgress = async (userId, lessonId, segmentId) => {
  const progress = await UserSegmentProgress.findOne({
    userId,
    lessonId,
    segmentId,
  });

  if (!progress) {
    throw new AppError(USER_SEGMENT_PROGRESS.SEGMENT_PROGRESS_NOT_FOUND, 404);
  }
  return progress;
};

export const updateSegmentProgress = async (
  userId,
  lessonId,
  segmentId,
  data
) => {
  const segment = await LessonSegment.findOne({ _id: segmentId, lessonId });
  if (!segment) {
    throw new AppError(USER_SEGMENT_PROGRESS.SEGMENT_NOT_FOUND_IN_LESSON, 404);
  }

  const set = {};
  const max = {};
  let displayText = '';
  let wordsAccuracy = {};
  const text =
    segment.transcript?.normalized || segment.transcript?.original || '';
  const totalWords = text.trim() ? text.trim().split(/\s+/).length : 0;
  //console.log(totalWords);

  if (data.dictation) {
    if (data.dictation.attemptCount !== undefined) {
      set['dictation.attemptCount'] = data.dictation.attemptCount;
    }
    if (data.dictation.hintUsedCount !== undefined) {
      set['dictation.hintUsedCount'] = data.dictation.hintUsedCount;
    }

    // Tính điểm Dictation dựa vào số lần thử và số lần dùng gợi ý
    const attempts = data.dictation.attemptCount || 1;
    const hints = data.dictation.hintUsedCount || 0;
    const attemptPenalty = (attempts - 1) * 5;
    const hintPenalty = (hints / totalWords) * 100;
    const score = Math.max(0, Math.round(100 - attemptPenalty - hintPenalty));
    max['dictation.bestScore'] = score;
  }

  if (data.shadowing) {
    if (data.shadowing.attemptCount !== undefined) {
      set['shadowing.attemptCount'] = data.shadowing.attemptCount;
    }
    if (data.shadowing.latestAudioUrl !== undefined) {
      set['shadowing.latestAudioUrl'] = data.shadowing.latestAudioUrl;
    }

    // Đánh giá phát âm qua Azure Speech API
    let aiScore = 0;

    if (data.shadowing.latestAudioUrl) {
      const referenceText =
        segment.transcript.normalized || segment.transcript.original;
      const evaluationResult = await evaluatePronunciation(
        data.shadowing.latestAudioUrl,
        referenceText
      );
      aiScore = evaluationResult.score;
      displayText = evaluationResult.displayText;
      wordsAccuracy = evaluationResult.wordsAccuracy;
      set['shadowing.wordsAccuracy'] = wordsAccuracy;
    }

    const attempt = data.shadowing.attemptCount || 1;
    const finalScore = Math.max(0, Math.round(aiScore) - (attempt - 1) * 10);
    //console.log(`[DEBUG] AI Score: ${aiScore}, Attempt: ${attempt}, Final Score: ${finalScore}`);
    max['shadowing.bestScore'] = finalScore;
  }
  set.updatedAt = new Date();

  const updatePayload = { $set: set };
  if (Object.keys(max).length > 0) {
    updatePayload.$max = max;
  }

  const progress = await UserSegmentProgress.findOneAndUpdate(
    { userId, lessonId, segmentId },
    updatePayload,
    { new: true, upsert: true }
  );

  const resultObj = progress.toObject();
  if (data.shadowing && data.shadowing.latestAudioUrl) {
    if (!resultObj.shadowing) {
      resultObj.shadowing = {};
    }
    resultObj.shadowing.displayText = displayText;
    resultObj.shadowing.wordsAccuracy = wordsAccuracy;
  }

  // Tính user lesson progress
  const allSegments = await LessonSegment.countDocuments({ lessonId });
  if (allSegments > 0) {
    const lessonUpdate = { updatedAt: new Date() };
    if (data.dictation) {
      const completedSegments = await UserSegmentProgress.countDocuments({
        userId,
        lessonId,
        'dictation.attemptCount': { $gt: 0 },
      });
      const pct = Math.round((completedSegments / allSegments) * 100);
      lessonUpdate['dictation.progressPct'] = pct;
      lessonUpdate['dictation.lastStartMs'] = segment.startMs;
      lessonUpdate['dictation.status'] =
        pct === 100 ? 'completed' : 'in_progress';
    }
    if (data.shadowing) {
      const completedSegments = await UserSegmentProgress.countDocuments({
        userId,
        lessonId,
        'shadowing.attemptCount': { $gt: 0 },
      });
      const pct = Math.round((completedSegments / allSegments) * 100);
      lessonUpdate['shadowing.progressPct'] = pct;
      lessonUpdate['shadowing.lastStartMs'] = segment.startMs;
      lessonUpdate['shadowing.status'] =
        pct === 100 ? 'completed' : 'in_progress';
    }
    await UserLessonProgress.findOneAndUpdate(
      { userId, lessonId },
      { $set: lessonUpdate },
      { upsert: true }
    );
  }

  const awardSegmentXp = async (mode) => {
    const xp = segmentXp(mode, progress[mode]?.bestScore);
    if (xp <= 0) return;
    try {
      await recordActivity(
        userId,
        'segment_complete',
        `${segmentId}:${mode}`,
        xp
      );
    } catch (e) {
      console.warn(`[gamification] segment XP (${mode}) failed:`, e.message);
    }
  };
  if (data.dictation) await awardSegmentXp('dictation');
  if (data.shadowing) await awardSegmentXp('shadowing');

  return resultObj;
};

export const getCardStates = async (userId, queryParams) => {
  const { deckId, topicId, due, starred, hidden, page, limit } = queryParams;
  const filter = { userId };
  if (deckId) filter.deckId = deckId;
  if (topicId) filter.topicId = topicId;
  if (starred !== undefined) filter['flags.starred'] = starred;
  if (hidden !== undefined) filter['flags.hidden'] = hidden;
  if (due) {
    filter['srs.nextReviewAt'] = { $lte: new Date() };
  }
  const skip = (page - 1) * limit;
  const [data, totalItems] = await Promise.all([
    (
      await UserCardState.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('cardId')
    ).filter((state) => state.cardId != null),
    UserCardState.countDocuments(filter),
  ]);
  const cardRequests = data
    .filter((state) => state.cardId)
    .map((state) => ({
      topicId: state.topicId || state.cardId.topicId,
      term: state.cardId.term,
      cardId: state.cardId._id.toString(),
    }));

  const quizOptionsMap = await generateQuizOptionsBatch(cardRequests);

  const items = data.map((state) => {
    const stateObj = state.toObject();
    if (stateObj.cardId) {
      stateObj.cardId.quizOptions =
        quizOptionsMap[stateObj.cardId._id.toString()] || [];
    }
    return stateObj;
  });

  return {
    data: items,
    pagination: {
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
  };
};

export const getCardState = async (userId, cardId) => {
  const cardState = await UserCardState.findOne({ userId, cardId }).populate(
    'cardId'
  );
  if (!cardState) {
    throw new AppError(USER_CARD_STATE.CARD_STATE_NOT_FOUND, 404);
  }
  const stateObj = cardState.toObject();
  if (stateObj.cardId) {
    stateObj.cardId.quizOptions = await generateQuizOptions(
      stateObj.topicId || stateObj.cardId.topicId,
      stateObj.cardId.term,
      stateObj.cardId._id
    );
  }

  return stateObj;
};

export const upsertCardState = async (userId, cardId, data) => {
  const { deckId, topicId, srs, flags } = data;
  let cardState = await UserCardState.findOne({ userId, cardId });
  if (!cardState) {
    // Create new
    if (!deckId || !topicId) {
      throw new AppError(USER_CARD_STATE.CARD_STATE_CREATE_MISSING_DATA, 400);
    }
    cardState = new UserCardState({
      userId,
      cardId,
      deckId,
      topicId,
      flags: flags || {},
    });
  } else {
    // Update nếu tồn tại rồi
    if (deckId) cardState.deckId = deckId;
    if (topicId) cardState.topicId = topicId;
    if (flags) {
      if (flags.starred !== undefined) cardState.flags.starred = flags.starred;
      if (flags.hidden !== undefined) cardState.flags.hidden = flags.hidden;
    }
  }
  const graded = srs && srs.lastGrade !== undefined;
  if (graded) {
    cardState.srs = calculateNextSRS(srs.lastGrade, cardState.srs);
  }
  await cardState.save();

  if (graded) {
    try {
      await recordActivity(userId, 'card_review', `${cardId}:${getDayKey()}`);
    } catch (e) {
      console.warn('[gamification] card_review XP failed:', e.message);
    }
  }

  return cardState;
};

export const updateProfile = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(COMMON.NOT_FOUND, 404, [], 'User not found');
  }

  if (data.name) {
    user.name = data.name;
  }
  if (data.newPassword && data.oldPassword) {
    const isMatch = await bcrypt.compare(data.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError(COMMON.INVALID_DATA, 400, [
        { field: 'oldPassword', message: 'Old password is incorrect' },
      ]);
    }
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(data.newPassword, salt);
    user.passwordChangedAt = new Date();
    if (redisClient.isOpen) {
      await redisClient.del(`user:auth:${userId}`);
    }
  }
  if (data.avatarUrl) {
    const key = await validateMediaUrl(
      data.avatarUrl,
      'avatar',
      userId,
      user.avatarUrl
    );
    if (key) {
      user.avatarUrl = data.avatarUrl;
    }
  }
  await user.save();
  return {
    name: user.name,
    avatarUrl: user.avatarUrl,
    email: user.email,
  };
};

export const getUserStats = async (userId) => {
  const [learnedLessons, reviewedCards] = await Promise.all([
    UserLessonProgress.countDocuments({ userId }),
    UserCardState.countDocuments({ userId }),
  ]);
  return {
    learnedLessons,
    reviewedCards,
  };
};

export const listAdminUsers = async (filters) => {
  const { q, page = 1, limit = 10, status } = filters;
  const skip = (page - 1) * limit;
  const query = { role: 'user' };
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  if (status) {
    if (status === 'active') {
      query.isActive = true;
      query.isVerified = true;
    } else if (status === 'unverified') {
      query.isActive = true;
      query.isVerified = false;
    } else if (status === 'banned') {
      query.isActive = false;
    }
  }
  const [data, totalItems] = await Promise.all([
    User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  const items = data.map((user) => {
    let currentStatus = 'active';
    if (!user.isActive) currentStatus = 'banned';
    else if (!user.isVerified) currentStatus = 'unverified';
    const obj = user.toObject();
    obj.status = currentStatus;
    delete obj.passwordHash;
    return obj;
  });
  return {
    users: items,
    pagination: {
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
  };
};

export const getAdminUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(ADMIN.USER_NOT_FOUND, 404);
  }
  let currentStatus = 'active';
  if (!user.isActive) currentStatus = 'banned';
  else if (!user.isVerified) currentStatus = 'unverified';
  const obj = user.toObject();
  obj.status = currentStatus;
  delete obj.passwordHash;
  return obj;
};

export const changeAdminUserPassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(ADMIN.USER_NOT_FOUND, 404);
  }
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.passwordChangedAt = new Date();
  await user.save();
  if (redisClient.isOpen) {
    await redisClient.del(`user:auth:${userId}`);
  }
  sendChangePasswordEmail(user.email, user.name, newPassword).catch((error) => {
    console.error('Lỗi gửi email thông báo thay đổi mật khẩu:', error);
  });
};

export const changeAdminUserStatus = async (userId, status, banReason = '') => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(ADMIN.USER_NOT_FOUND, 404);
  }
  if (status === 'active') {
    user.isActive = true;
    user.banReason = '';
  } else if (status === 'banned') {
    user.isActive = false;
    user.banReason = banReason;
    sendBanEmail(user.email, user.name, banReason).catch((error) => {
      console.error('Lỗi gửi email thông báo khóa tài khoản:', error);
    });
  } else
    throw new AppError(USER.INVALID_STATUS, 404, [
      { field: 'status', message: 'Status must be active or banned' },
    ]);
  await user.save();
  if (redisClient.isOpen) {
    await redisClient.del(`user:auth:${userId}`);
  }
};
