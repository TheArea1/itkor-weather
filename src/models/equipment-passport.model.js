import { DataTypes, Model } from 'sequelize';

export class EquipmentPassport extends Model {
  static initModel(sequelize) {
    EquipmentPassport.init({
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      equipmentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'equipment_id' },
      manufacturer: { type: DataTypes.STRING(100), allowNull: false },
      model: { type: DataTypes.STRING(100), allowNull: false },
      nominalPower: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'nominal_power' },
      lastCalibrationAt: { type: DataTypes.DATEONLY, field: 'last_calibration_at' },
    }, { sequelize, modelName: 'EquipmentPassport', tableName: 'equipment_passports' });
    return EquipmentPassport;
  }
}
