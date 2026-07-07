import { createClient } from 'redis';
import { config } from './env.js';

const client = createClient({
  url: config.redisUrl,
  socket: {
    // Tự động kết nối lại sau mỗi khoảng tăng dần từ 200ms đến tối đa 5000ms
    reconnectStrategy: (retries) => {
      console.log(`[Redis] Reconnecting attempt: ${retries}`);
      return Math.min(retries * 200, 5000);
    },
  },
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Redis Client connecting...');
});

client.on('ready', () => {
  console.log('Redis Client Ready');
});

export const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log('Connected to Redis successfully');
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

const makeSafeRedisClient = (rawClient) => {
  return new Proxy(rawClient, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value === 'function') {
        return async (...args) => {
          if (!target.isOpen) {
            try {
              console.log(
                `[Redis Proxy] Client is closed. Attempting to connect before executing "${prop}"...`
              );
              await connectRedis();
            } catch (err) {
              console.error(
                `[Redis Proxy] Failed to connect before executing "${prop}":`,
                err
              );
            }
          }
          return value.apply(target, args);
        };
      }
      return value;
    },
  });
};

const safeRedisClient = makeSafeRedisClient(client);

export default safeRedisClient;
