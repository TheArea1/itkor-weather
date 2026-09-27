import { QueryTypes } from 'sequelize';
import { NotFoundError } from '../errors/app-error.js';
import { sequelize, Site } from '../models/index.js';

export const siteService = {
  async summary(id) {
    const site = await Site.findByPk(id, { attributes: ['id'] });
    if (!site) throw new NotFoundError('Площадка не найдена');
    const [byStatus, byPriority, [duration]] = await Promise.all([
      sequelize.query(`
        SELECT mr.status::text AS status, COUNT(*)::integer AS count
        FROM maintenance_requests mr
        JOIN equipment e ON e.id = mr.equipment_id
        WHERE e.site_id = :siteId
        GROUP BY mr.status
        ORDER BY mr.status
      `, { replacements: { siteId: id }, type: QueryTypes.SELECT }),
      sequelize.query(`
        SELECT mr.priority::text AS priority, COUNT(*)::integer AS count
        FROM maintenance_requests mr
        JOIN equipment e ON e.id = mr.equipment_id
        WHERE e.site_id = :siteId
        GROUP BY mr.priority
        ORDER BY mr.priority
      `, { replacements: { siteId: id }, type: QueryTypes.SELECT }),
      sequelize.query(`
        SELECT AVG(mr.updated_at - mr.created_at) FILTER (WHERE mr.status = 'done') AS "averageTimeToClose"
        FROM maintenance_requests mr
        JOIN equipment e ON e.id = mr.equipment_id
        WHERE e.site_id = :siteId
      `, { replacements: { siteId: id }, type: QueryTypes.SELECT }),
    ]);
    return {
      requestCountByStatus: Object.fromEntries(byStatus.map((row) => [row.status, row.count])),
      requestCountByPriority: Object.fromEntries(byPriority.map((row) => [row.priority, row.count])),
      averageTimeToClose: duration.averageTimeToClose,
    };
  },
};
