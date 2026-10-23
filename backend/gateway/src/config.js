const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  authUrl: process.env.AUTH_URL || 'http://localhost:4001',
  boardUrl: process.env.BOARD_URL || 'http://localhost:4002',
  realtimeUrl: process.env.REALTIME_URL || 'http://localhost:4003',
};
