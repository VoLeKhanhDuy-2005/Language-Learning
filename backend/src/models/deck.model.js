import mongoose from 'mongoose';

const deckSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    tagIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    cefrLevelIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CefrLevel',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    ownerType: {
      type: String,
      enum: ['system', 'user'],
      default: 'system',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    topicCount: {
      type: Number,
      default: 0,
    },
    cardCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Deck =
  mongoose.models.Deck || mongoose.model('Deck', deckSchema, 'decks');
export default Deck;
