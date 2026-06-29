import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@setdit.local',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    fullname: process.env.ADMIN_FULLNAME || 'Super Admin',
  },

  bcrypt: {
    saltRounds: 12,
  },

  otp: {
    length: 6,
    expiresIn: 5 * 60, // 5 minutes in seconds
  },

  login: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60, // 15 minutes in seconds
  },
};