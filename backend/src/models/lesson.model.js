import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
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
    modes: [
      {
        type: String,
        enum: ['dictation', 'shadowing'],
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Lesson =
  mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema, 'lessons');
export default Lesson;
