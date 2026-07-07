import mongoose from 'mongoose';

const userSegmentProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    segmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LessonSegment',
      required: true,
    },
    dictation: {
      attemptCount: {
        type: Number,
      },
      bestScore: {
        type: Number,
      },
      hintUsedCount: {
        type: Number,
      },
    },
    shadowing: {
      attemptCount: {
        type: Number,
      },
      bestScore: {
        type: Number,
      },
      latestAudioUrl: {
        type: String,
      },
      wordsAccuracy: {
        type: Map,
        of: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserSegmentProgress =
  mongoose.models.UserSegmentProgress ||
  mongoose.model(
    'UserSegmentProgress',
    userSegmentProgressSchema,
    'user_segment_progress'
  );
export default UserSegmentProgress;
