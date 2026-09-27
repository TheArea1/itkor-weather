'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";', { transaction });

      await queryInterface.sequelize.query(`
        CREATE TYPE equipment_type AS ENUM ('turbine', 'inverter', 'sensor', 'substation');
        CREATE TYPE equipment_status AS ENUM ('operational', 'maintenance', 'fault', 'decommissioned');
        CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high', 'critical');
        CREATE TYPE request_status AS ENUM ('new', 'in_progress', 'done', 'rejected');
        CREATE TYPE assignee_role AS ENUM ('lead', 'member');
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TABLE sites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(150) NOT NULL,
          code VARCHAR(50) NOT NULL UNIQUE,
          region VARCHAR(100) NOT NULL,
          latitude NUMERIC(9, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
          longitude NUMERIC(9, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE equipment (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          site_id UUID NOT NULL REFERENCES sites(id) ON UPDATE CASCADE ON DELETE RESTRICT,
          name VARCHAR(100) NOT NULL,
          type equipment_type NOT NULL,
          serial_number VARCHAR(100) NOT NULL UNIQUE,
          status equipment_status NOT NULL DEFAULT 'operational',
          installed_at DATE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE equipment_passports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          equipment_id UUID NOT NULL UNIQUE REFERENCES equipment(id) ON UPDATE CASCADE ON DELETE CASCADE,
          manufacturer VARCHAR(100) NOT NULL,
          model VARCHAR(100) NOT NULL,
          nominal_power NUMERIC(12, 2) NOT NULL CHECK (nominal_power >= 0),
          last_calibration_at DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE maintenance_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          equipment_id UUID NOT NULL REFERENCES equipment(id) ON UPDATE CASCADE ON DELETE RESTRICT,
          title VARCHAR(120) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          priority request_priority NOT NULL,
          status request_status NOT NULL DEFAULT 'new',
          planned_at TIMESTAMPTZ,
          author VARCHAR(150) NOT NULL DEFAULT 'system',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE request_status_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON UPDATE CASCADE ON DELETE CASCADE,
          previous_status request_status NOT NULL,
          new_status request_status NOT NULL,
          changed_by VARCHAR(150) NOT NULL DEFAULT 'system',
          comment TEXT,
          changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CHECK (previous_status <> new_status)
        );

        CREATE TABLE technicians (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name VARCHAR(150) NOT NULL,
          specialization VARCHAR(150) NOT NULL,
          personnel_number VARCHAR(50) NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE request_assignees (
          request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON UPDATE CASCADE ON DELETE CASCADE,
          technician_id UUID NOT NULL REFERENCES technicians(id) ON UPDATE CASCADE ON DELETE RESTRICT,
          role assignee_role NOT NULL,
          hours NUMERIC(7, 2) NOT NULL CHECK (hours > 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (request_id, technician_id)
        );

        CREATE INDEX equipment_site_id_idx ON equipment(site_id);
        CREATE INDEX maintenance_requests_equipment_id_idx ON maintenance_requests(equipment_id);
        CREATE INDEX maintenance_requests_status_priority_idx ON maintenance_requests(status, priority);
        CREATE INDEX maintenance_requests_created_at_idx ON maintenance_requests(created_at DESC);
        CREATE INDEX request_status_history_request_id_changed_at_idx ON request_status_history(request_id, changed_at DESC);
        CREATE INDEX request_assignees_technician_id_idx ON request_assignees(technician_id);
      `, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS request_assignees;
        DROP TABLE IF EXISTS request_status_history;
        DROP TABLE IF EXISTS maintenance_requests;
        DROP TABLE IF EXISTS technicians;
        DROP TABLE IF EXISTS equipment_passports;
        DROP TABLE IF EXISTS equipment;
        DROP TABLE IF EXISTS sites;
        DROP TYPE IF EXISTS assignee_role;
        DROP TYPE IF EXISTS request_status;
        DROP TYPE IF EXISTS request_priority;
        DROP TYPE IF EXISTS equipment_status;
        DROP TYPE IF EXISTS equipment_type;
      `, { transaction });
    });
  },
};
