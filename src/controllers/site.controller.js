import { siteService } from '../services/site.service.js';

export const siteController = {
  summary: async (req, res) => res.json({ data: await siteService.summary(req.params.id) }),
};
