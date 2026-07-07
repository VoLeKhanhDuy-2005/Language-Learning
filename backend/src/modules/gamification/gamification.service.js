import UserGamification from '../../models/userGamification.model.js';
import XpEvent from '../../models/xpEvent.model.js';
import {
  XP,
  getDayKey,
  computeLevel,
} from '../../config/gamification.config.js';

const SOURCE_XP_MAP = {
  segment_complete: XP.segmentComplete,
  card_review: XP.cardReview,
  battle_play: XP.battlePlay,
  battle_win: XP.battleWin,
  daily_streak: XP.dailyStreakBonus,
};

export async function ensureProfile(userId) {
  try {
    return await UserGamification.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      return UserGamification.findOne({ userId });
    }
    throw err;
  }
}

// Direct XP award — no streak logic. Used for battle_win, daily_streak internally.
export async function awardXp(userId, source, refId, amount) {
  try {
    await XpEvent.create({ userId, source, refId, amount });
  } catch (err) {
    if (err.code === 11000) return;
    throw err;
  }

  const doc = await UserGamification.findOneAndUpdate(
    { userId },
    { $inc: { totalXp: amount }, $set: { lastXpAt: new Date() } },
    { upsert: true, new: true }
  );

  const newLevel = computeLevel(doc.totalXp);
  if (newLevel !== doc.level) {
    await UserGamification.updateOne({ userId }, { $set: { level: newLevel } });
  }
}

// Single entry point for all real learning actions.
// Updates streak + awards XP atomically (idempotent via xpEvent unique index).
export async function recordActivity(userId, source, refId, amountOverride) {
  const dayKey = getDayKey();
  const yesterdayKey = getDayKey(new Date(Date.now() - 86400000));

  const amount = amountOverride ?? SOURCE_XP_MAP[source];
  if (amount === undefined)
    throw new Error(`Unknown gamification source: ${source}`);
  // Non-positive amount -> no event written, no streak update.
  if (amount <= 0) return;

  // Idempotency: duplicate activity returns early, no double XP.
  try {
    await XpEvent.create({ userId, source, refId, amount });
  } catch (err) {
    if (err.code === 11000) return;
    throw err;
  }

  // Atomically inc XP; upsert creates profile for first-ever activity.
  const doc = await UserGamification.findOneAndUpdate(
    { userId },
    { $inc: { totalXp: amount }, $set: { lastXpAt: new Date() } },
    { upsert: true, new: true }
  );

  // Streak logic — compare against today and yesterday keys.
  let { currentStreak, longestStreak, lastActiveDayKey } = doc;
  let streakIncremented = false;

  if (lastActiveDayKey === dayKey) {
    // Already active today: no streak change.
  } else if (lastActiveDayKey === yesterdayKey) {
    currentStreak = (currentStreak || 0) + 1;
    streakIncremented = true;
  } else {
    // Gap or first ever: reset to 1.
    currentStreak = 1;
    streakIncremented = true;
  }

  longestStreak = Math.max(longestStreak || 0, currentStreak);

  await UserGamification.updateOne(
    { userId },
    { $set: { currentStreak, longestStreak, lastActiveDayKey: dayKey } }
  );

  let finalTotalXp = doc.totalXp;

  // Award daily streak bonus once per day (idempotent via refId=dayKey).
  if (streakIncremented) {
    try {
      await XpEvent.create({
        userId,
        source: 'daily_streak',
        refId: dayKey,
        amount: XP.dailyStreakBonus,
      });
      const bonusDoc = await UserGamification.findOneAndUpdate(
        { userId },
        {
          $inc: { totalXp: XP.dailyStreakBonus },
          $set: { lastXpAt: new Date() },
        },
        { new: true }
      );
      finalTotalXp = bonusDoc.totalXp;
    } catch (err) {
      if (err.code !== 11000) throw err;
      // Race: another request already awarded today's streak bonus.
      const current = await UserGamification.findOne({ userId });
      finalTotalXp = current ? current.totalXp : doc.totalXp;
    }
  }

  // Recompute level after all XP changes.
  const newLevel = computeLevel(finalTotalXp);
  if (newLevel !== doc.level) {
    await UserGamification.updateOne({ userId }, { $set: { level: newLevel } });
  }
}

// Streak-only update: bumps the daily streak (+ daily bonus once/day) WITHOUT
// granting any action XP. Used for activities that count as "learning today"
// but must not award farmable XP — e.g. invite (private) battle matches.
// Naturally idempotent: re-running same day is a no-op (lastActiveDayKey check),
// daily bonus guarded by unique (userId, 'daily_streak', dayKey).
export async function touchStreak(userId) {
  const dayKey = getDayKey();
  const yesterdayKey = getDayKey(new Date(Date.now() - 86400000));

  const doc = await ensureProfile(userId);

  let { currentStreak, longestStreak, lastActiveDayKey } = doc;
  let streakIncremented = false;

  if (lastActiveDayKey === dayKey) {
    // Already active today: nothing to do.
  } else if (lastActiveDayKey === yesterdayKey) {
    currentStreak = (currentStreak || 0) + 1;
    streakIncremented = true;
  } else {
    currentStreak = 1;
    streakIncremented = true;
  }

  longestStreak = Math.max(longestStreak || 0, currentStreak);

  await UserGamification.updateOne(
    { userId },
    { $set: { currentStreak, longestStreak, lastActiveDayKey: dayKey } }
  );

  if (!streakIncremented) return;

  // Award daily streak bonus once per day (idempotent via refId=dayKey).
  try {
    await XpEvent.create({
      userId,
      source: 'daily_streak',
      refId: dayKey,
      amount: XP.dailyStreakBonus,
    });
    const bonusDoc = await UserGamification.findOneAndUpdate(
      { userId },
      {
        $inc: { totalXp: XP.dailyStreakBonus },
        $set: { lastXpAt: new Date() },
      },
      { new: true }
    );
    const newLevel = computeLevel(bonusDoc.totalXp);
    if (newLevel !== bonusDoc.level) {
      await UserGamification.updateOne(
        { userId },
        { $set: { level: newLevel } }
      );
    }
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Race: another request already awarded today's streak bonus.
  }
}

export async function getProfile(userId) {
  return ensureProfile(userId);
}

export async function getLeaderboard({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    UserGamification.find()
      .sort({ totalXp: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatarUrl'),
    UserGamification.countDocuments(),
  ]);

  return {
    items: items.map((doc, i) => {
      const user = doc.userId || {};
      return {
        rank: skip + i + 1,
        userId: user._id ?? doc.userId,
        name: user.name ?? null,
        avatarUrl: user.avatarUrl ?? null,
        totalXp: doc.totalXp,
        level: doc.level,
      };
    }),
    page,
    limit,
    total,
  };
}

export async function getMyRank(userId) {
  const profile = await ensureProfile(userId);
  const [above, totalPlayers] = await Promise.all([
    UserGamification.countDocuments({
      $or: [
        { totalXp: { $gt: profile.totalXp } },
        { totalXp: profile.totalXp, _id: { $lt: profile._id } },
      ],
    }),
    UserGamification.countDocuments(),
  ]);
  return { rank: above + 1, totalXp: profile.totalXp, totalPlayers };
}
