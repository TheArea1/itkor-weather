import { ConflictError, NotFoundError } from '../errors/app-error.js';

export function toDatabaseAppError(error, { notFoundMessage = 'Связанный ресурс не найден' } = {}) {
  if (error?.name === 'SequelizeUniqueConstraintError' || error?.original?.code === '23505') {
    return new ConflictError('Ресурс с такими уникальными полями уже существует');
  }
  if (error?.name === 'SequelizeForeignKeyConstraintError' || error?.original?.code === '23503') {
    return new NotFoundError(notFoundMessage);
  }
  return null;
}

export function mapDatabaseError(error, options) {
  const appError = toDatabaseAppError(error, options);
  if (appError) throw appError;
  throw error;
}
