import { DataTypes, Model } from 'sequelize';

export class MaintenanceRequest extends Model {
  static initModel(sequelize) {
    MaintenanceRequest.init({
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      equipmentId: { type: DataTypes.UUID, allowNull: false, field: 'equipment_id' },
      title: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), allowNull: false },
      status: { type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'), allowNull: false, defaultValue: 'new' },
      plannedAt: { type: DataTypes.DATE, field: 'planned_at' },
      author: { type: DataTypes.STRING(150), allowNull: false, defaultValue: 'system' },
    }, { sequelize, modelName: 'MaintenanceRequest', tableName: 'maintenance_requests' });
    return MaintenanceRequest;
  }
}
