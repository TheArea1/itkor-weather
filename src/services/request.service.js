import { ConflictError, NotFoundError } from '../errors/app-error.js';
import { Equipment, MaintenanceRequest } from '../models/index.js';
import { includeAssignees } from './assignee.service.js';
import { mapDatabaseError } from '../utils/database-error.js';
import { parseDatabaseListQuery, toListResponse } from '../utils/database-list.js';
import { validateRequest, validateStatus } from './validation.service.js';

const requestAttributes = ['id', 'equipmentId', 'title', 'description', 'priority', 'status', 'plannedAt', 'author', 'createdAt', 'updatedAt'];
const transitions = { new: ['in_progress', 'rejected'], in_progress: ['done', 'rejected'], done: [], rejected: [] };

export const requestService = {
  async list(query) {
    const options = parseDatabaseListQuery(query, {
      createdAt: 'createdAt', updatedAt: 'updatedAt', priority: 'priority', status: 'status', plannedAt: 'plannedAt', title: 'title',
    }, { status: 'status', priority: 'priority', equipmentId: 'equipmentId' });
    return toListResponse(await MaintenanceRequest.findAndCountAll({ ...options, attributes: requestAttributes, include: includeAssignees(), distinct: true }), options.meta);
  },

  async get(id) {
    const item = await MaintenanceRequest.findByPk(id, { attributes: requestAttributes, include: includeAssignees() });
    if (!item) throw new NotFoundError('Заявка не найдена');
    return item;
  },

  async create(body) {
    const data = validateRequest(body);
    try {
      if (!await Equipment.findByPk(data.equipmentId, { attributes: ['id'] })) throw new NotFoundError('Оборудование для заявки не найдено');
      return await MaintenanceRequest.create({ ...data, title: data.title.trim(), description: data.description || '', status: 'new' });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      mapDatabaseError(error, { notFoundMessage: 'Оборудование для заявки не найдено' });
    }
  },

  async update(id, body) {
    const item = await this.get(id);
    const data = validateRequest(body, true);
    try {
      if (data.equipmentId && !await Equipment.findByPk(data.equipmentId, { attributes: ['id'] })) throw new NotFoundError('Оборудование для заявки не найдено');
      await item.update({ ...data, title: data.title?.trim() });
      return item;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      mapDatabaseError(error, { notFoundMessage: 'Оборудование для заявки не найдено' });
    }
  },

  async changeStatus(id, body) {
    const request = await this.get(id);
    const status = validateStatus(body);
    if (!transitions[request.status].includes(status)) throw new ConflictError(`Переход из статуса ${request.status} в ${status} недопустим`);
    await request.update({ status });
    return request;
  },

  async remove(id) {
    const item = await this.get(id);
    await item.destroy();
  },
};
