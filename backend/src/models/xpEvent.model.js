import mongoose from 'mongoose';

const xpEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: [
        'segment_complete',
        'card_review',
        'battle_play',
        'battle_win',
        'daily_streak',
      ],
      required: true,
    },
    refId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Idempotency: same userId+source+refId cannot award XP twice.
// sparse: true skips docs where refId is null, allowing repeat-free sources.
xpEventSchema.index(
  { userId: 1, source: 1, refId: 1 },
  { unique: true, sparse: true }
);

const XpEvent =
  mongoose.models.XpEvent ||
  mongoose.model('XpEvent', xpEventSchema, 'xp_events');

export default XpEvent;
