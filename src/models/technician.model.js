import { DataTypes, Model } from 'sequelize';

export class Technician extends Model {
  static initModel(sequelize) {
    Technician.init({
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
      specialization: { type: DataTypes.STRING(150), allowNull: false },
      personnelNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'personnel_number' },
    }, { sequelize, modelName: 'Technician', tableName: 'technicians' });
    return Technician;
  }
}
