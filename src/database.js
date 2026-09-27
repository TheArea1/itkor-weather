import { Sequelize } from 'sequelize';
import { config } from './config.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  logging: config.nodeEnv === 'development' && config.database.logging ? console.debug : false,
  pool: config.database.pool,
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function checkDatabaseConnection() {
  await sequelize.authenticate();
}
