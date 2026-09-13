import process from 'node:process';

export const config = {
    geocodingApiUrl: process.env.GEOCODING_API_URL ?? 'https://geocoding-api.open-meteo.com/v1/search',
    weatherApiUrl: process.env.WEATHER_API_URL ?? 'https://api.open-meteo.com/v1/forecast',
    requestTimeout: Number(process.env.REQUEST_TIMEOUT) || 5000,
    reportsDir: process.env.REPORTS_DIR || 'reports',
};