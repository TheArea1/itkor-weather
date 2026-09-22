import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { config } from '../config.js';

const emptyDatabase = () => ({ equipment: [], requests: [] });
let writeQueue = Promise.resolve();

function databasePath() {
  return path.resolve(process.cwd(), config.dataFile);
}

async function readDatabase() {
  try {
    const content = await fs.readFile(databasePath(), 'utf8');
    const data = JSON.parse(content);
    return { equipment: Array.isArray(data.equipment) ? data.equipment : [], requests: Array.isArray(data.requests) ? data.requests : [] };
  } catch (error) {
    if (error.code === 'ENOENT') return emptyDatabase();
    throw error;
  }
}

function saveDatabase(data) {
  writeQueue = writeQueue.then(async () => {
    const filePath = databasePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  });
  return writeQueue;
}

export const databaseRepository = {
  async getAll(collection) { return (await readDatabase())[collection]; },
  async findById(collection, id) { return (await readDatabase())[collection].find((item) => item.id === id) ?? null; },
  async findOne(collection, predicate) { return (await readDatabase())[collection].find(predicate) ?? null; },
  async create(collection, item) { const db = await readDatabase(); db[collection].push(item); await saveDatabase(db); return item; },
  async update(collection, id, changes) { const db = await readDatabase(); const index = db[collection].findIndex((item) => item.id === id); if (index < 0) return null; db[collection][index] = { ...db[collection][index], ...changes }; await saveDatabase(db); return db[collection][index]; },
  async delete(collection, id) { const db = await readDatabase(); const index = db[collection].findIndex((item) => item.id === id); if (index < 0) return false; db[collection].splice(index, 1); await saveDatabase(db); return true; },
};
