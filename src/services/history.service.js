import { NotFoundError } from '../errors/app-error.js';
import { MaintenanceRequest, RequestStatusHistory } from '../models/index.js';

const historyAttributes = ['id', 'requestId', 'previousStatus', 'newStatus', 'changedBy', 'comment', 'changedAt'];

export const historyService = {
  async list(requestId) {
    const request = await MaintenanceRequest.findByPk(requestId, { attributes: ['id'] });
    if (!request) throw new NotFoundError('Заявка не найдена');
    return RequestStatusHistory.findAll({
      where: { requestId },
      attributes: historyAttributes,
      order: [['changedAt', 'DESC']],
    });
  },
};
