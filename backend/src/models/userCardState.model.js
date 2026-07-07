import mongoose from 'mongoose';

const userCardStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    srs: {
      easeFactor: {
        type: Number,
        default: 2.5,
      },
      interval: {
        type: Number,
        default: 0,
      },
      lastGrade: {
        type: Number,
        default: 0,
      },
      nextReviewAt: {
        type: Date,
      },
    },
    flags: {
      starred: {
        type: Boolean,
        default: false,
      },
      hidden: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserCardState =
  mongoose.models.UserCardState ||
  mongoose.model('UserCardState', userCardStateSchema, 'user_card_states');
export default UserCardState;
