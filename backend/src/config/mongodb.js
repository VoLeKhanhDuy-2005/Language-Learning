import mongoose from 'mongoose';

export const connectMongoDB = async () => {
  try {
    // Khi chạy E2E test (NODE_ENV=test), dùng DB riêng để không ảnh hưởng dữ liệu thật
    const uri =
      process.env.NODE_ENV === 'test' && process.env.MONGODB_URI_E2E
        ? process.env.MONGODB_URI_E2E
        : process.env.MONGODB_URI || 'mongodb://localhost:27017/minlish';
    await mongoose.connect(uri);
    console.log(
      `MongoDB connected successfully. [DB: ${process.env.NODE_ENV === 'test' ? 'E2E' : 'main'}]`
    );
  } catch (error) {
    console.error('Unable to connect to MongoDB:', error);
    throw error;
  }
};
