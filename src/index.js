import process from 'node:process';
import {getCliArgs} from './cli.js';
import {getCoordinates, getWeatherForecast} from './api/index.js';
import {getCachedReport, saveReport} from './storage/index.js';
import {displayWeatherReport} from './format/index.js';


async function processCity(cityName, days, noCache) {
    if (!noCache){
        const cachedData = await getCachedReport(cityName);
        if (cachedData) {
            displayWeatherReport({...cachedData, isFromCache: true});
            return;
        }
    }

    const geoData = await getCoordinates(cityName);
    const forecast = await getWeatherForecast(geoData.latitude, geoData.longitude, days);
    const reportData = {...geoData, forecast, };

    displayWeatherReport({...reportData, isFromCache: false});
    await saveReport(cityName, reportData);
}

async function main() {
    try {
        const {cities, days, noCache} = getCliArgs();
        const results = await Promise.allSettled(
            cities.map((cityName) => processCity(cityName, days, noCache))
        );

        let hasErrors = false;

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                hasErrors = true;
                console.error(`\n Ошибка при обработке города "${cities[index]}": ${result.reason.message}`);
            }
        });

        const allFailed = results.every((r) => r.status === 'rejected');
        if (allFailed && results.length > 0) {
        process.exitCode = 1;
        }

        process.exit(0);
    } catch(error) {
        console.error(`\n Критическая ошибка: ${error.message}`);
        process.exitCode = 1;
    }
}

main();