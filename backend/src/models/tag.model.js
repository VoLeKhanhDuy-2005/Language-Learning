import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
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
    timestamps: false,
  }
);

const Tag = mongoose.models.Tag || mongoose.model('Tag', tagSchema, 'tags');
export default Tag;
