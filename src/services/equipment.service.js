import { ConflictError, NotFoundError } from '../errors/app-error.js';
import { Equipment, EquipmentPassport, MaintenanceRequest, Site } from '../models/index.js';
import { mapDatabaseError } from '../utils/database-error.js';
import { parseDatabaseListQuery, toListResponse } from '../utils/database-list.js';
import { validateEquipment } from './validation.service.js';

const equipmentAttributes = ['id', 'siteId', 'name', 'type', 'serialNumber', 'status', 'installedAt', 'createdAt', 'updatedAt'];
const passportAttributes = ['id', 'equipmentId', 'manufacturer', 'model', 'nominalPower', 'lastCalibrationAt'];
const requestAttributes = ['id', 'equipmentId', 'title', 'description', 'priority', 'status', 'plannedAt', 'author', 'createdAt', 'updatedAt'];

const equipmentInclude = [
  { model: Site, as: 'site', attributes: ['id', 'name', 'code', 'region', 'latitude', 'longitude'] },
  { model: EquipmentPassport, as: 'passport', attributes: passportAttributes },
];

function serializeEquipment(item) {
  const result = item.toJSON();
  if (result.site) result.location = { lat: Number(result.site.latitude), lon: Number(result.site.longitude) };
  delete result.siteId;
  delete result.site;
  return result;
}

async function resolveSite(data) {
  if (data.siteId) return Site.findByPk(data.siteId, { attributes: ['id'] });
  if (!data.location) return null;
  const lat = Number(data.location.lat).toFixed(6);
  const lon = Number(data.location.lon).toFixed(6);
  const code = `LEGACY-${lat}-${lon}`;
  const [site] = await Site.findOrCreate({
    where: { code },
    defaults: { name: `Площадка ${lat}, ${lon}`, code, region: 'Не указан', latitude: lat, longitude: lon },
  });
  return site;
}

export const equipmentService = {
  async list(query) {
    const options = parseDatabaseListQuery(query, {
      createdAt: 'createdAt', name: 'name', type: 'type', status: 'status', installedAt: 'installedAt',
    }, { type: 'type', status: 'status' });
    const result = await Equipment.findAndCountAll({ ...options, attributes: equipmentAttributes, include: equipmentInclude, distinct: true });
    return { ...toListResponse(result, options.meta), data: result.rows.map(serializeEquipment) };
  },

  async get(id) {
    const item = await Equipment.findByPk(id, { attributes: equipmentAttributes, include: equipmentInclude });
    if (!item) throw new NotFoundError('Оборудование не найдено');
    return serializeEquipment(item);
  },

  async create(body) {
    const data = validateEquipment(body);
    try {
      const site = await resolveSite(data);
      if (!site) throw new NotFoundError('Площадка для оборудования не найдена');
      const item = await Equipment.create({ ...data, siteId: site.id, serialNumber: data.serialNumber.trim(), name: data.name.trim() });
      return this.get(item.id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      mapDatabaseError(error, { notFoundMessage: 'Площадка для оборудования не найдена' });
    }
  },

  async update(id, body) {
    const item = await Equipment.findByPk(id);
    if (!item) throw new NotFoundError('Оборудование не найдено');
    const data = validateEquipment(body, true);
    try {
      const site = (data.siteId || data.location) ? await resolveSite(data) : null;
      await item.update({ ...data, ...(site ? { siteId: site.id } : {}), name: data.name?.trim(), serialNumber: data.serialNumber?.trim() });
      return this.get(id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      mapDatabaseError(error, { notFoundMessage: 'Площадка для оборудования не найдена' });
    }
  },

  async remove(id) {
    const item = await this.get(id);
    const openCount = await MaintenanceRequest.count({ where: { equipmentId: id, status: ['new', 'in_progress'] } });
    if (openCount > 0) throw new ConflictError('Нельзя удалить оборудование с открытыми заявками');
    await Equipment.destroy({ where: { id: item.id } });
  },

  async requests(id, query) {
    await this.get(id);
    const options = parseDatabaseListQuery(query, {
      createdAt: 'createdAt', updatedAt: 'updatedAt', priority: 'priority', status: 'status', plannedAt: 'plannedAt',
    }, { status: 'status', priority: 'priority' });
    options.where.equipmentId = id;
    return toListResponse(await MaintenanceRequest.findAndCountAll({ ...options, attributes: requestAttributes }), options.meta);
  },
};
