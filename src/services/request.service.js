import { randomUUID } from 'node:crypto';
import { databaseRepository } from '../repositories/database.repository.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import { validateRequest, validateStatus } from './validation.service.js';
import { parseListQuery, paginate } from '../utils/list.js';

const collection = 'requests';
const transitions = { new: ['in_progress', 'rejected'], in_progress: ['done', 'rejected'], done: [], rejected: [] };
export const requestService = {
  async list(query) { return paginate(await databaseRepository.getAll(collection), parseListQuery(query, ['createdAt', 'updatedAt', 'priority', 'status', 'plannedAt', 'title'], { status: true, priority: true, equipmentId: true, dateFrom: true, dateTo: true })); },
  async get(id) { const item = await databaseRepository.findById(collection, id); if (!item) throw new NotFoundError('Заявка не найдена'); return item; },
  async create(body) { const data = validateRequest(body); if (!await databaseRepository.findById('equipment', data.equipmentId)) throw new NotFoundError('Оборудование для заявки не найдено'); const now = new Date().toISOString(); return databaseRepository.create(collection, { id: randomUUID(), ...data, title: data.title.trim(), description: data.description || '', status: 'new', createdAt: now, updatedAt: now }); },
  async update(id, body) { await this.get(id); const data = validateRequest(body, true); if (data.equipmentId && !await databaseRepository.findById('equipment', data.equipmentId)) throw new NotFoundError('Оборудование для заявки не найдено'); return databaseRepository.update(collection, id, { ...data, updatedAt: new Date().toISOString() }); },
  async changeStatus(id, body) { const request = await this.get(id); const status = validateStatus(body); if (!transitions[request.status].includes(status)) throw new ConflictError(`Переход из статуса ${request.status} в ${status} недопустим`); return databaseRepository.update(collection, id, { status, updatedAt: new Date().toISOString() }); },
  async remove(id) { await this.get(id); await databaseRepository.delete(collection, id); },
};
