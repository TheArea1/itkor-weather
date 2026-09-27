require('dotenv').config();

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const database = {
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: numberFromEnv('POSTGRES_PORT', 5432),
  database: process.env.POSTGRES_DB || 'itkor',
  username: process.env.POSTGRES_USER || 'itkor',
  password: process.env.POSTGRES_PASSWORD || '',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  pool: {
    min: numberFromEnv('DB_POOL_MIN', 0),
    max: numberFromEnv('DB_POOL_MAX', 10),
    acquire: numberFromEnv('DB_POOL_ACQUIRE_MS', 30000),
    idle: numberFromEnv('DB_POOL_IDLE_MS', 10000),
  },
};

module.exports = {
  development: database,
  test: database,
  production: database,
};
