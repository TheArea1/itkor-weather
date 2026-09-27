import { historyService } from '../services/history.service.js';

export const historyController = {
  list: async (req, res) => res.json({ data: await historyService.list(req.params.id) }),
};
