import { requestService } from '../services/request.service.js';

export const requestController = {
  list: async (req, res) => res.json(await requestService.list(req.query)),
  get: async (req, res) => res.json({ data: await requestService.get(req.params.id) }),
  create: async (req, res) => { const item = await requestService.create(req.body); res.location(`/api/requests/${item.id}`).status(201).json({ data: item }); },
  update: async (req, res) => res.json({ data: await requestService.update(req.params.id, req.body) }),
  changeStatus: async (req, res) => res.json({ data: await requestService.changeStatus(req.params.id, req.body) }),
  remove: async (req, res) => { await requestService.remove(req.params.id); res.status(204).end(); },
};
