import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    connected: { type: Boolean, default: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    cardId: { type: mongoose.Schema.Types.ObjectId },
    term: { type: String },
    correctAnswer: { type: String },
    options: [{ type: String }],
  },
  { _id: false }
);

const battleMatchSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ['mcq', 'typing'], required: true },
    matchType: { type: String, enum: ['queue', 'invite'], required: true },
    roomCode: { type: String, sparse: true, unique: true },
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'finished', 'abandoned'],
      default: 'waiting',
    },
    players: [playerSchema],
    questions: [questionSchema],
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { timestamps: true, collection: 'battle_matches' }
);

export const BattleMatch =
  mongoose.models.BattleMatch ||
  mongoose.model('BattleMatch', battleMatchSchema, 'battle_matches');
