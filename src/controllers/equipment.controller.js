import { equipmentService } from '../services/equipment.service.js';
import { getEquipmentWeather } from '../services/weather.service.js';

export const equipmentController = {
  list: async (req, res) => res.json(await equipmentService.list(req.query)),
  get: async (req, res) => res.json({ data: await equipmentService.get(req.params.id) }),
  create: async (req, res) => { const item = await equipmentService.create(req.body); res.location(`/api/equipment/${item.id}`).status(201).json({ data: item }); },
  update: async (req, res) => res.json({ data: await equipmentService.update(req.params.id, req.body) }),
  remove: async (req, res) => { await equipmentService.remove(req.params.id); res.status(204).end(); },
  requests: async (req, res) => res.json(await equipmentService.requests(req.params.id, req.query)),
  weather: async (req, res) => { const equipment = await equipmentService.get(req.params.id); res.json({ data: { equipmentId: equipment.id, location: equipment.location, ...(await getEquipmentWeather(equipment.location)) } }); },
};
