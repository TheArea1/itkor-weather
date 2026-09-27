import { DataTypes, Model } from 'sequelize';

export class RequestAssignee extends Model {
  static initModel(sequelize) {
    RequestAssignee.init({
      requestId: { type: DataTypes.UUID, primaryKey: true, allowNull: false, field: 'request_id' },
      technicianId: { type: DataTypes.UUID, primaryKey: true, allowNull: false, field: 'technician_id' },
      role: { type: DataTypes.ENUM('lead', 'member'), allowNull: false },
      hours: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
    }, { sequelize, modelName: 'RequestAssignee', tableName: 'request_assignees' });
    return RequestAssignee;
  }
}
