const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

function validateTz(tz) {
  try {
    Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

export const TZ = validateTz(process.env.GAMIFY_TZ || DEFAULT_TZ);

export const XP = {
  segmentComplete: 10,
  cardReview: 3,
  battlePlay: 15,
  battleWin: 35,
  dailyStreakBonus: 20,
};

export const SEGMENT_XP = {
  dictation: { pass: 60, xp: 10 },
  shadowing: { pass: 55, xp: 12 },
};

export function segmentXp(mode, score) {
  const cfg = SEGMENT_XP[mode];
  if (!cfg || typeof score !== 'number' || score < cfg.pass) return 0;
  return cfg.xp;
}

export const BATTLE = {
  rounds: 10,
  startCountdownMs: 3000,
  perQuestionMs: 12000,
  roundRevealMs: 3000,
  speedBonusMax: 50,
  queueTimeoutMs: 30000,
  reconnectGraceMs: 15000,
  minCorrectForReward: 3,
};

export function getDayKey(date = new Date()) {
  return Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
}

export function requiredXpForLevel(level) {
  return 50 * level * (level + 1);
}

export function computeLevel(totalXp) {
  if (totalXp < 0) return 1;
  let level = 1;
  while (totalXp >= requiredXpForLevel(level)) {
    level++;
  }
  return level;
}
