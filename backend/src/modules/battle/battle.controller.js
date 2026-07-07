import { successResponse } from '../../utils/response.js';
import { BATTLE, COMMON } from '../../constants/codes/index.js';
import AppError from '../../utils/AppError.js';
import * as service from './battle.service.js';
import { historyQuerySchema } from './battle.schema.js';

export const getHistory = async (req, res, next) => {
  const result = historyQuerySchema.safeParse(req.query);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(new AppError(COMMON.INVALID_DATA, 400, errors));
  }
  try {
    const data = await service.getHistory(req.user.id, result.data);
    res.json(successResponse(BATTLE.HISTORY_FETCHED, data));
  } catch (err) {
    next(err);
  }
};

export const getMatch = async (req, res, next) => {
  try {
    const match = await service.getMatchById(req.params.id);
    if (!match) {
      return next(new AppError(BATTLE.MATCH_NOT_FOUND, 404));
    }

    // Only participants may view a match.
    const isParticipant = match.players.some((p) => {
      const id = p.userId?._id ?? p.userId;
      return id?.toString() === req.user.id;
    });
    if (!isParticipant) {
      return next(new AppError(COMMON.FORBIDDEN, 403));
    }

    res.json(successResponse(BATTLE.MATCH_FETCHED, match));
  } catch (err) {
    next(err);
  }
};
