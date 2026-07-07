import mongoose from 'mongoose';

const cefrLevelSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const CefrLevel =
  mongoose.models.CefrLevel ||
  mongoose.model('CefrLevel', cefrLevelSchema, 'cefr_levels');
export default CefrLevel;
