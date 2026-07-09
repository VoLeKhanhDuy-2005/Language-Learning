import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['minlish', 'network'],
      required: true,
    },
  },
  { _id: false, timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Cuộc hội thoại mới',
      maxlength: 100,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    lastMode: {
      type: String,
      enum: ['minlish', 'network'],
      default: 'minlish',
    },
  },
  {
    timestamps: true,
  }
);

const AIConversation =
  mongoose.models.AIConversation ||
  mongoose.model('AIConversation', aiConversationSchema, 'ai_conversations');

export default AIConversation;
