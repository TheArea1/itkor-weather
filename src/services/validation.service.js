import { ValidationError } from '../errors/app-error.js';

export const EQUIPMENT_TYPES = ['turbine', 'inverter', 'sensor', 'substation'];
export const EQUIPMENT_STATUSES = ['operational', 'maintenance', 'fault', 'decommissioned'];
export const REQUEST_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const REQUEST_STATUSES = ['new', 'in_progress', 'done', 'rejected'];

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const isIsoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const isIsoDateTime = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));

function validationResult(errors) { if (errors.length) throw new ValidationError('Проверьте поля запроса', errors); }
function allowedBody(body, fields) { return Object.fromEntries(Object.entries(body || {}).filter(([key]) => fields.includes(key))); }
function enumCheck(errors, field, value, options) { if (value !== undefined && !options.includes(value)) errors.push({ field, message: `Допустимо: ${options.join(', ')}` }); }

export function validateEquipment(body, partial = false) {
  const data = allowedBody(body, ['name', 'type', 'serialNumber', 'location', 'siteId', 'status', 'installedAt']); const errors = [];
  for (const field of ['name', 'type', 'serialNumber', 'location', 'status', 'installedAt']) if (!partial && data[field] === undefined) errors.push({ field, message: 'Обязательное поле' });
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 3 || data.name.trim().length > 100)) errors.push({ field: 'name', message: 'Строка от 3 до 100 символов' });
  enumCheck(errors, 'type', data.type, EQUIPMENT_TYPES); enumCheck(errors, 'status', data.status, EQUIPMENT_STATUSES);
  if (data.serialNumber !== undefined && (typeof data.serialNumber !== 'string' || !data.serialNumber.trim())) errors.push({ field: 'serialNumber', message: 'Непустая строка' });
  if (data.location !== undefined && (!isObject(data.location) || !Number.isFinite(data.location.lat) || !Number.isFinite(data.location.lon) || data.location.lat < -90 || data.location.lat > 90 || data.location.lon < -180 || data.location.lon > 180)) errors.push({ field: 'location', message: 'Объект с lat [-90;90] и lon [-180;180]' });
  if (data.installedAt !== undefined && (!isIsoDate(data.installedAt) || new Date(data.installedAt) > new Date())) errors.push({ field: 'installedAt', message: 'ISO-дата, не позднее текущей' });
  validationResult(errors); return data;
}

export function validateRequest(body, partial = false) {
  const data = allowedBody(body, ['equipmentId', 'title', 'description', 'priority', 'plannedAt']); const errors = [];
  for (const field of ['equipmentId', 'title', 'priority']) if (!partial && data[field] === undefined) errors.push({ field, message: 'Обязательное поле' });
  if (data.equipmentId !== undefined && (typeof data.equipmentId !== 'string' || !data.equipmentId.trim())) errors.push({ field: 'equipmentId', message: 'Непустой идентификатор' });
  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length < 5 || data.title.trim().length > 120)) errors.push({ field: 'title', message: 'Строка от 5 до 120 символов' });
  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.length > 2000)) errors.push({ field: 'description', message: 'Строка не длиннее 2000 символов' });
  enumCheck(errors, 'priority', data.priority, REQUEST_PRIORITIES);
  if (data.plannedAt !== undefined && !isIsoDateTime(data.plannedAt)) errors.push({ field: 'plannedAt', message: 'Корректная ISO datetime' });
  validationResult(errors); return data;
}

export function validateStatus(body) {
  const status = body?.status; if (!REQUEST_STATUSES.includes(status)) throw new ValidationError('Некорректный статус', [{ field: 'status', message: `Допустимо: ${REQUEST_STATUSES.join(', ')}` }]); return status;
}
