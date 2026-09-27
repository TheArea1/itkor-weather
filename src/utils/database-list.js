import { Op } from 'sequelize';
import { ValidationError } from '../errors/app-error.js';

export function parseDatabaseListQuery(query, sortableFields, filterMap) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError('Некорректная пагинация', [{ field: 'page/limit', message: 'page >= 1, limit от 1 до 100' }]);
  }

  const sortBy = query.sortBy || 'createdAt';
  if (!Object.hasOwn(sortableFields, sortBy)) {
    throw new ValidationError('Некорректное поле сортировки', [{ field: 'sortBy', message: `Допустимо: ${Object.keys(sortableFields).join(', ')}` }]);
  }

  const order = String(query.order || 'desc').toUpperCase();
  if (!['ASC', 'DESC'].includes(order)) {
    throw new ValidationError('Некорректный порядок сортировки', [{ field: 'order', message: 'asc или desc' }]);
  }

  const where = {};
  for (const [queryKey, column] of Object.entries(filterMap)) {
    if (query[queryKey] !== undefined && query[queryKey] !== '') where[column] = query[queryKey];
  }

  if (query.dateFrom !== undefined || query.dateTo !== undefined) {
    const range = {};
    if (query.dateFrom !== undefined) {
      const value = new Date(query.dateFrom);
      if (Number.isNaN(value.valueOf())) throw new ValidationError('Некорректная дата', [{ field: 'dateFrom', message: 'Корректная ISO-дата' }]);
      range[Op.gte] = value;
    }
    if (query.dateTo !== undefined) {
      const value = new Date(`${query.dateTo}T23:59:59.999Z`);
      if (Number.isNaN(value.valueOf())) throw new ValidationError('Некорректная дата', [{ field: 'dateTo', message: 'Корректная ISO-дата' }]);
      range[Op.lte] = value;
    }
    where.createdAt = range;
  }

  return { where, limit, offset: (page - 1) * limit, order: [[sortableFields[sortBy], order]], meta: { page, limit } };
}

export function toListResponse(result, meta) {
  return { data: result.rows, meta: { total: result.count, ...meta } };
}
