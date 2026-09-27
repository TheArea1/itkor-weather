import { ConflictError, NotFoundError } from '../errors/app-error.js';

export function mapDatabaseError(error, { notFoundMessage = 'Связанный ресурс не найден' } = {}) {
  if (error?.name === 'SequelizeUniqueConstraintError') {
    throw new ConflictError('Ресурс с такими уникальными полями уже существует');
  }
  if (error?.name === 'SequelizeForeignKeyConstraintError') {
    throw new NotFoundError(notFoundMessage);
  }
  throw error;
}
