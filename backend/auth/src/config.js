if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  port: Number(process.env.PORT || 4001),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/auth',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
};
