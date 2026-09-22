import { ValidationError } from '../errors/app-error.js';

export function parseListQuery(query, allowedSort, filters = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError('Некорректная пагинация', [{ field: 'page/limit', message: 'page >= 1, limit от 1 до 100' }]);
  }
  const sortBy = query.sortBy || 'createdAt';
  if (!allowedSort.includes(sortBy)) throw new ValidationError('Некорректное поле сортировки', [{ field: 'sortBy', message: `Допустимо: ${allowedSort.join(', ')}` }]);
  const order = (query.order || 'desc').toLowerCase();
  if (!['asc', 'desc'].includes(order)) throw new ValidationError('Некорректный порядок сортировки', [{ field: 'order', message: 'asc или desc' }]);
  return { page, limit, sortBy, order, filters: Object.fromEntries(Object.keys(filters).filter((key) => query[key] !== undefined).map((key) => [key, query[key]])) };
}

export function paginate(items, options) {
  const filtered = items.filter((item) => Object.entries(options.filters).every(([key, value]) => {
    if (key === 'dateFrom') return new Date(item.createdAt) >= new Date(value);
    if (key === 'dateTo') return new Date(item.createdAt) <= new Date(`${value}T23:59:59.999Z`);
    return String(item[key]) === value;
  }));
  filtered.sort((a, b) => { const result = String(a[options.sortBy] ?? '').localeCompare(String(b[options.sortBy] ?? '')); return options.order === 'asc' ? result : -result; });
  return { data: filtered.slice((options.page - 1) * options.limit, options.page * options.limit), meta: { total: filtered.length, page: options.page, limit: options.limit } };
}
