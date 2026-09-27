import { sequelize } from '../models/index.js';
import { assigneeService } from '../services/assignee.service.js';

export const assigneeController = {
  replace: async (req, res) => {
    const assignees = await sequelize.transaction(async (transaction) => assigneeService.replace(req.params.id, req.body, transaction));
    res.json({ data: assignees });
  },
  remove: async (req, res) => {
    await sequelize.transaction(async (transaction) => assigneeService.remove(req.params.id, req.params.userId, transaction));
    res.status(204).end();
  },
};
