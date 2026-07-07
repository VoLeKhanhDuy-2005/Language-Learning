import mongoose from 'mongoose';

const phoneticSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
    },
    audio: {
      type: String,
      trim: true,
    },
    locale: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const cardSchema = new mongoose.Schema(
  {
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
    order: {
      type: Number,
      required: true,
    },
    term: {
      type: String,
      required: true,
      trim: true,
    },
    pos: {
      type: String,
      default: '',
      trim: true,
    },
    phonetics: [phoneticSchema],
    translation: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      vi: {
        type: String,
        default: '',
      },
      en: {
        type: String,
        default: '',
      },
    },
    examples: {
      vi: {
        type: String,
        default: '',
      },
      en: {
        type: String,
        default: '',
      },
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Card =
  mongoose.models.Card || mongoose.model('Card', cardSchema, 'cards');
export default Card;
