import { DataTypes, Model } from 'sequelize';

export class RequestStatusHistory extends Model {
  static initModel(sequelize) {
    RequestStatusHistory.init({
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      requestId: { type: DataTypes.UUID, allowNull: false, field: 'request_id' },
      previousStatus: { type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'), allowNull: false, field: 'previous_status' },
      newStatus: { type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'), allowNull: false, field: 'new_status' },
      changedBy: { type: DataTypes.STRING(150), allowNull: false, defaultValue: 'system', field: 'changed_by' },
      comment: { type: DataTypes.TEXT },
      changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'changed_at' },
    }, { sequelize, modelName: 'RequestStatusHistory', tableName: 'request_status_history', createdAt: false, updatedAt: false });
    return RequestStatusHistory;
  }
}
