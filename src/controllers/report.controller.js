import { reportService } from '../services/report.service.js';

export const reportController = {
  equipmentLoad: async (req, res) => res.json({ data: await reportService.equipmentLoad(req.query) }),
};
