const dotenv = require('dotenv');

dotenv.config();

const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const corsOrigins = rawCorsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const config = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || '',
  corsOrigin: rawCorsOrigin,
  corsOrigins,
  trustProxy: String(process.env.TRUST_PROXY || 'true').toLowerCase() === 'true',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  platformPasswordHash: process.env.PLATFORM_PASSWORD_HASH || '',
  requireAuthForSync: String(process.env.REQUIRE_AUTH_FOR_SYNC || 'false').toLowerCase() === 'true'
};

module.exports = { config };
