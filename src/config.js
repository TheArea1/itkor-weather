import process from 'node:process';
import 'dotenv/config';

function readPositiveNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  port: readPositiveNumber('PORT', 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimitWindowMs: readPositiveNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMax: readPositiveNumber('RATE_LIMIT_MAX', 100),
  weatherApiUrl: process.env.WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast',
  requestTimeoutMs: readPositiveNumber('REQUEST_TIMEOUT_MS', 5000),
  dataFile: process.env.DATA_FILE || 'data/database.json',
  weatherMaxWindSpeed: readPositiveNumber('WEATHER_MAX_WIND_SPEED', 10),
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: readPositiveNumber('POSTGRES_PORT', 5432),
    name: process.env.POSTGRES_DB || 'itkor',
    user: process.env.POSTGRES_USER || 'itkor',
    password: process.env.POSTGRES_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      min: readPositiveNumber('DB_POOL_MIN', 0),
      max: readPositiveNumber('DB_POOL_MAX', 10),
      acquire: readPositiveNumber('DB_POOL_ACQUIRE_MS', 30000),
      idle: readPositiveNumber('DB_POOL_IDLE_MS', 10000),
    },
  },
};
