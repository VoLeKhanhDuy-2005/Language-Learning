import mongoose from 'mongoose';

const lessonSegmentSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    startMs: {
      type: Number,
      required: true,
    },
    endMs: {
      type: Number,
      required: true,
    },
    transcript: {
      original: {
        type: String,
        required: true,
      },
      normalized: {
        type: String,
        required: true,
      },
    },
    translation: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const LessonSegment =
  mongoose.models.LessonSegment ||
  mongoose.model('LessonSegment', lessonSegmentSchema, 'lesson_segments');
export default LessonSegment;
