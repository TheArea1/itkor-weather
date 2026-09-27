import { Op } from 'sequelize';
import { NotFoundError, ValidationError } from '../errors/app-error.js';
import { MaintenanceRequest, RequestAssignee, Technician } from '../models/index.js';

const technicianAttributes = ['id', 'fullName', 'specialization', 'personnelNumber'];
const throughAttributes = ['role', 'hours'];

function validateAssignees(assignees) {
  if (!Array.isArray(assignees) || assignees.length === 0) {
    throw new ValidationError('Некорректная бригада', [{ field: 'assignees', message: 'Нужен непустой список специалистов' }]);
  }
  const ids = new Set();
  let leadCount = 0;
  for (const [index, assignee] of assignees.entries()) {
    if (!assignee || typeof assignee !== 'object' || typeof assignee.technicianId !== 'string' || !['lead', 'member'].includes(assignee.role)) {
      throw new ValidationError('Некорректная бригада', [{ field: `assignees[${index}]`, message: 'Нужны technicianId и role lead|member' }]);
    }
    if (ids.has(assignee.technicianId)) {
      throw new ValidationError('Некорректная бригада', [{ field: `assignees[${index}].technicianId`, message: 'Специалист не должен повторяться' }]);
    }
    ids.add(assignee.technicianId);
    if (assignee.role === 'lead') leadCount += 1;
    const hours = Number(assignee.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new ValidationError('Некорректная бригада', [{ field: `assignees[${index}].hours`, message: 'Положительное число часов' }]);
    }
  }
  if (leadCount !== 1) throw new ValidationError('Некорректная бригада', [{ field: 'assignees', message: 'Должен быть ровно один lead' }]);
  return assignees;
}

function includeAssignees() {
  return [{
    model: Technician,
    as: 'assignees',
    attributes: technicianAttributes,
    through: { attributes: throughAttributes },
  }];
}

export const assigneeService = {
  async listForRequest(requestId, transaction) {
    const request = await MaintenanceRequest.findByPk(requestId, { attributes: ['id'], include: includeAssignees(), transaction });
    if (!request) throw new NotFoundError('Заявка не найдена');
    return request.assignees;
  },

  async replace(requestId, body, transaction) {
    const request = await MaintenanceRequest.findByPk(requestId, { attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });
    if (!request) throw new NotFoundError('Заявка не найдена');
    const assignees = validateAssignees(body.assignees);
    const ids = assignees.map((item) => item.technicianId);
    const technicians = await Technician.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });
    if (technicians.length !== ids.length) throw new NotFoundError('Один или несколько специалистов не найдены');
    await RequestAssignee.destroy({ where: { requestId }, transaction });
    await RequestAssignee.bulkCreate(assignees.map((item) => ({ requestId, technicianId: item.technicianId, role: item.role, hours: Number(item.hours) })), { transaction });
    const updated = await MaintenanceRequest.findByPk(requestId, { attributes: ['id'], include: includeAssignees(), transaction });
    return updated.assignees;
  },

  async remove(requestId, technicianId, transaction) {
    const request = await MaintenanceRequest.findByPk(requestId, { attributes: ['id'], transaction });
    if (!request) throw new NotFoundError('Заявка не найдена');
    const deleted = await RequestAssignee.destroy({ where: { requestId, technicianId }, transaction });
    if (!deleted) throw new NotFoundError('Специалист не назначен на заявку');
  },
};

export { includeAssignees };
