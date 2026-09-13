import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { config } from '../config.js';

function getReportFilePath(cityName){
    const today = new Date().toISOString().split('T')[0];
    const sanitizedCity = cityName.toLowerCase().replace(/\s+/g, '_');
    const fileName = `${sanitizedCity}-${today}.json`;
    return path.join(process.cwd(), config.reportsDir, fileName);
}

export async function getCachedReport(cityName) {
    const filePath = getReportFilePath(cityName);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export async function saveReport(cityName, reportData) {
    const filePath = getReportFilePath(cityName);
    const dirPath = path.dirname(filePath);

    try {
        await fs.mkdir(dirPath, {recursive: true});
        await fs.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf-8');
    } catch (error){
        console.error(`Не удалось сохранить отчет для города ${cityName}: ${error.message}`);
    }
}