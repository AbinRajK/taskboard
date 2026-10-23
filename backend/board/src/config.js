export const config = {
  port: Number(process.env.PORT || 4002),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/boards',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
