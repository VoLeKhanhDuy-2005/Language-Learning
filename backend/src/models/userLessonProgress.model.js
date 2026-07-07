import mongoose from 'mongoose';

const userLessonProgressSchema = new mongoose.Schema(
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
    dictation: {
      status: {
        type: String,
        enum: ['in_progress', 'completed'],
      },
      progressPct: {
        type: Number,
      },
      lastStartMs: {
        type: Number,
      },
    },
    shadowing: {
      status: {
        type: String,
        enum: ['in_progress', 'completed'],
      },
      progressPct: {
        type: Number,
      },
      lastStartMs: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserLessonProgress =
  mongoose.models.UserLessonProgress ||
  mongoose.model(
    'UserLessonProgress',
    userLessonProgressSchema,
    'user_lesson_progress'
  );
export default UserLessonProgress;
