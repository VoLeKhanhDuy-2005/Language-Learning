import mongoose from 'mongoose';

const userGamificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalXp: {
      type: Number,
      default: 0,
      index: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDayKey: {
      type: String,
      default: null,
    },
    lastXpAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Stable leaderboard paging: sort by XP desc, _id asc tiebreak.
userGamificationSchema.index({ totalXp: -1, _id: 1 });

const UserGamification =
  mongoose.models.UserGamification ||
  mongoose.model(
    'UserGamification',
    userGamificationSchema,
    'user_gamification'
  );
export default UserGamification;
