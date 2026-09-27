'use strict';

const { randomUUID } = require('node:crypto');

const iso = (value) => new Date(value).toISOString();
const dateOnly = (value) => value;

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const sites = [
        { id: randomUUID(), name: 'Северная площадка', code: 'SITE-NORTH', region: 'Московская область', latitude: 55.751244, longitude: 37.618423 },
        { id: randomUUID(), name: 'Южная площадка', code: 'SITE-SOUTH', region: 'Краснодарский край', latitude: 45.03547, longitude: 38.975313 },
      ].map((site) => ({ ...site, created_at: iso('2025-01-01T09:00:00Z'), updated_at: iso('2025-01-01T09:00:00Z') }));
      await queryInterface.bulkInsert('sites', sites, { transaction });

      const equipmentTypes = ['inverter', 'sensor', 'turbine', 'substation', 'inverter', 'sensor'];
      const equipment = equipmentTypes.map((type, index) => ({
        id: randomUUID(),
        site_id: sites[index % sites.length].id,
        name: `${type === 'inverter' ? 'Инвертор' : type === 'sensor' ? 'Датчик' : type === 'turbine' ? 'Турбина' : 'Подстанция'} №${index + 1}`,
        type,
        serial_number: `DEMO-${String(index + 1).padStart(3, '0')}`,
        status: ['operational', 'maintenance', 'fault', 'operational', 'operational', 'maintenance'][index],
        installed_at: dateOnly(`2024-0${(index % 6) + 1}-10`),
        created_at: iso('2025-01-02T09:00:00Z'),
        updated_at: iso('2025-01-02T09:00:00Z'),
      }));
      await queryInterface.bulkInsert('equipment', equipment, { transaction });

      const passports = equipment.map((item, index) => ({
        id: randomUUID(),
        equipment_id: item.id,
        manufacturer: ['Siemens', 'ABB', 'Vestas'][index % 3],
        model: `MODEL-${index + 1}`,
        nominal_power: [250, 500, 750, 1000][index % 4],
        last_calibration_at: dateOnly(`2024-12-${String((index % 9) + 1).padStart(2, '0')}`),
        created_at: iso('2025-01-02T09:00:00Z'),
        updated_at: iso('2025-01-02T09:00:00Z'),
      }));
      await queryInterface.bulkInsert('equipment_passports', passports, { transaction });

      const technicians = [
        ['Иванов Иван Петрович', 'Электрооборудование', 'EMP-001'],
        ['Петров Пётр Сергеевич', 'Автоматика', 'EMP-002'],
        ['Сидорова Анна Викторовна', 'Диагностика', 'EMP-003'],
        ['Кузнецов Алексей Игоревич', 'Механика', 'EMP-004'],
        ['Смирнова Ольга Андреевна', 'КИПиА', 'EMP-005'],
      ].map(([full_name, specialization, personnel_number]) => ({
        id: randomUUID(), full_name, specialization, personnel_number,
        created_at: iso('2025-01-03T09:00:00Z'), updated_at: iso('2025-01-03T09:00:00Z'),
      }));
      await queryInterface.bulkInsert('technicians', technicians, { transaction });

      const statuses = ['new', 'in_progress', 'done', 'rejected'];
      const priorities = ['low', 'medium', 'high', 'critical'];
      const requests = Array.from({ length: 20 }, (_, index) => ({
        id: randomUUID(),
        equipment_id: equipment[index % equipment.length].id,
        title: `Плановое обслуживание оборудования №${index + 1}`,
        description: `Демонстрационная заявка для проверки сценария ${index + 1}`,
        priority: priorities[index % priorities.length],
        status: statuses[index % statuses.length],
        planned_at: iso(`2025-02-${String((index % 20) + 1).padStart(2, '0')}T09:00:00Z`),
        author: `seed-user-${(index % 4) + 1}`,
        created_at: iso(`2025-01-${String((index % 20) + 1).padStart(2, '0')}T10:00:00Z`),
        updated_at: iso(`2025-01-${String((index % 20) + 1).padStart(2, '0')}T12:00:00Z`),
      }));
      await queryInterface.bulkInsert('maintenance_requests', requests, { transaction });

      const history = requests.filter((request) => request.status !== 'new').map((request) => ({
        id: randomUUID(),
        request_id: request.id,
        previous_status: 'new',
        new_status: request.status,
        changed_by: 'seed-user-1',
        comment: 'Начальная история из демонстрационного сида',
        changed_at: request.updated_at,
      }));
      await queryInterface.bulkInsert('request_status_history', history, { transaction });

      const assignees = requests
        .filter((request) => request.status === 'in_progress' || request.status === 'done')
        .flatMap((request, index) => [
          { request_id: request.id, technician_id: technicians[index % technicians.length].id, role: 'lead', hours: 4, created_at: request.created_at, updated_at: request.updated_at },
          { request_id: request.id, technician_id: technicians[(index + 1) % technicians.length].id, role: 'member', hours: 2, created_at: request.created_at, updated_at: request.updated_at },
        ]);
      await queryInterface.bulkInsert('request_assignees', assignees, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        DELETE FROM request_assignees WHERE request_id IN (SELECT id FROM maintenance_requests WHERE author LIKE 'seed-user-%');
        DELETE FROM request_status_history WHERE changed_by = 'seed-user-1';
        DELETE FROM maintenance_requests WHERE author LIKE 'seed-user-%';
        DELETE FROM equipment_passports WHERE equipment_id IN (SELECT id FROM equipment WHERE serial_number LIKE 'DEMO-%');
        DELETE FROM equipment WHERE serial_number LIKE 'DEMO-%';
        DELETE FROM technicians WHERE personnel_number LIKE 'EMP-%';
        DELETE FROM sites WHERE code IN ('SITE-NORTH', 'SITE-SOUTH');
      `, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
