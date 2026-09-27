import { sequelize } from '../database.js';
import { Site } from './site.model.js';
import { Equipment } from './equipment.model.js';
import { EquipmentPassport } from './equipment-passport.model.js';
import { MaintenanceRequest } from './maintenance-request.model.js';
import { RequestStatusHistory } from './request-status-history.model.js';
import { Technician } from './technician.model.js';
import { RequestAssignee } from './request-assignee.model.js';

Site.initModel(sequelize);
Equipment.initModel(sequelize);
EquipmentPassport.initModel(sequelize);
MaintenanceRequest.initModel(sequelize);
RequestStatusHistory.initModel(sequelize);
Technician.initModel(sequelize);
RequestAssignee.initModel(sequelize);

Site.hasMany(Equipment, { foreignKey: 'siteId', as: 'equipment' });
Equipment.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

Equipment.hasOne(EquipmentPassport, { foreignKey: 'equipmentId', as: 'passport' });
EquipmentPassport.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

Equipment.hasMany(MaintenanceRequest, { foreignKey: 'equipmentId', as: 'requests' });
MaintenanceRequest.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

MaintenanceRequest.hasMany(RequestStatusHistory, { foreignKey: 'requestId', as: 'statusHistory' });
RequestStatusHistory.belongsTo(MaintenanceRequest, { foreignKey: 'requestId', as: 'request' });

MaintenanceRequest.belongsToMany(Technician, {
  through: RequestAssignee,
  foreignKey: 'requestId',
  otherKey: 'technicianId',
  as: 'assignees',
});
Technician.belongsToMany(MaintenanceRequest, {
  through: RequestAssignee,
  foreignKey: 'technicianId',
  otherKey: 'requestId',
  as: 'requests',
});

export {
  sequelize,
  Site,
  Equipment,
  EquipmentPassport,
  MaintenanceRequest,
  RequestStatusHistory,
  Technician,
  RequestAssignee,
};
