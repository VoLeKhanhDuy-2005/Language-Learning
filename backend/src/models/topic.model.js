import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    cardCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Topic =
  mongoose.models.Topic || mongoose.model('Topic', topicSchema, 'topics');
export default Topic;
