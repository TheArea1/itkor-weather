import { randomUUID } from 'node:crypto';
import { databaseRepository } from '../repositories/database.repository.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import { validateEquipment } from './validation.service.js';
import { parseListQuery, paginate } from '../utils/list.js';

const collection = 'equipment';
export const equipmentService = {
  async list(query) { return paginate(await databaseRepository.getAll(collection), parseListQuery(query, ['createdAt', 'name', 'type', 'status', 'installedAt'], { type: true, status: true, dateFrom: true, dateTo: true })); },
  async get(id) { const item = await databaseRepository.findById(collection, id); if (!item) throw new NotFoundError('Оборудование не найдено'); return item; },
  async create(body) { const data = validateEquipment(body); if (await databaseRepository.findOne(collection, (item) => item.serialNumber === data.serialNumber)) throw new ConflictError('Оборудование с таким serialNumber уже существует'); const now = new Date().toISOString(); return databaseRepository.create(collection, { id: randomUUID(), ...data, name: data.name.trim(), serialNumber: data.serialNumber.trim(), createdAt: now, updatedAt: now }); },
  async update(id, body) { await this.get(id); const data = validateEquipment(body, true); if (data.serialNumber && await databaseRepository.findOne(collection, (item) => item.serialNumber === data.serialNumber && item.id !== id)) throw new ConflictError('Оборудование с таким serialNumber уже существует'); return databaseRepository.update(collection, id, { ...data, updatedAt: new Date().toISOString() }); },
  async remove(id) { await this.get(id); const requests = await databaseRepository.getAll('requests'); if (requests.some((request) => request.equipmentId === id && !['done', 'rejected'].includes(request.status))) throw new ConflictError('Нельзя удалить оборудование с открытыми заявками'); await databaseRepository.delete(collection, id); },
  async requests(id, query) { await this.get(id); const requests = await databaseRepository.getAll('requests'); return paginate(requests.filter((request) => request.equipmentId === id), parseListQuery(query, ['createdAt', 'updatedAt', 'priority', 'status', 'plannedAt'], { status: true, priority: true, dateFrom: true, dateTo: true })); },
};
