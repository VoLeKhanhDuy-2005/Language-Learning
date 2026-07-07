import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { connectMongoDB } from './src/config/mongodb.js';
import { connectRedis } from './src/config/redis.js';
import { initSocket } from './src/socket/index.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  try {
    await connectMongoDB();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
