import { QueryTypes } from 'sequelize';
import { sequelize } from '../models/index.js';
import { ValidationError } from '../errors/app-error.js';

const reportSort = {
  serial_number: 'e.serial_number',
  request_count: 'request_count',
  closed_count: 'closed_count',
  planned_hours: 'planned_hours',
  last_service_at: 'last_service_at',
};

function parseReportQuery(query) {
  const minRequests = query.minRequests === undefined ? 0 : Number(query.minRequests);
  if (!Number.isInteger(minRequests) || minRequests < 0 || minRequests > 1000000) {
    throw new ValidationError('Некорректный минимум заявок', [{ field: 'minRequests', message: 'Целое число от 0 до 1000000' }]);
  }
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
  const dateTo = query.dateTo ? new Date(`${query.dateTo}T23:59:59.999Z`) : null;
  if (dateFrom && Number.isNaN(dateFrom.valueOf())) throw new ValidationError('Некорректный период', [{ field: 'dateFrom', message: 'Корректная ISO-дата' }]);
  if (dateTo && Number.isNaN(dateTo.valueOf())) throw new ValidationError('Некорректный период', [{ field: 'dateTo', message: 'Корректная ISO-дата' }]);
  if (dateFrom && dateTo && dateFrom > dateTo) throw new ValidationError('Некорректный период', [{ field: 'dateFrom/dateTo', message: 'dateFrom не позже dateTo' }]);
  const sortBy = query.sortBy || 'request_count';
  if (!Object.hasOwn(reportSort, sortBy)) throw new ValidationError('Некорректное поле сортировки', [{ field: 'sortBy', message: Object.keys(reportSort).join(', ') }]);
  const order = String(query.order || 'desc').toUpperCase();
  if (!['ASC', 'DESC'].includes(order)) throw new ValidationError('Некорректный порядок сортировки', [{ field: 'order', message: 'asc или desc' }]);
  return { minRequests, dateFrom, dateTo, sortBy, order };
}

export const reportService = {
  async equipmentLoad(query) {
    const { minRequests, dateFrom, dateTo, sortBy, order } = parseReportQuery(query);
    return sequelize.query(`
      SELECT
        e.id AS "equipmentId",
        e.name,
        e.serial_number AS "serialNumber",
        e.type,
        COUNT(DISTINCT mr.id)::integer AS "requestCount",
        COUNT(DISTINCT mr.id) FILTER (WHERE mr.status = 'done')::integer AS "closedCount",
        COALESCE(SUM(ra.hours), 0)::numeric AS "plannedHours",
        MAX(mr.updated_at) FILTER (WHERE mr.status = 'done') AS "lastServiceAt"
      FROM equipment e
      LEFT JOIN maintenance_requests mr
        ON mr.equipment_id = e.id
        AND (:dateFrom IS NULL OR mr.created_at >= CAST(:dateFrom AS timestamptz))
        AND (:dateTo IS NULL OR mr.created_at <= CAST(:dateTo AS timestamptz))
      LEFT JOIN request_assignees ra ON ra.request_id = mr.id
      GROUP BY e.id, e.name, e.serial_number, e.type
      HAVING COUNT(DISTINCT mr.id) >= :minRequests
      ORDER BY ${reportSort[sortBy]} ${order}
    `, {
      replacements: {
        minRequests,
        dateFrom: dateFrom?.toISOString() || null,
        dateTo: dateTo?.toISOString() || null,
      },
      type: QueryTypes.SELECT,
    });
  },
};
