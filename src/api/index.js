import {config} from '../config.js';

async function fetchWithTimeout(url, options ={}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeout);

    try {
        const response = await fetch(url, {...options, signal: controller.signal });

        if (!response.ok) {
            const errorMsg = response.status >= 500
             ? `Ошибка сервера (статус ${response.status})`
             : `Ошибка запроса (статус ${response.status})`;
            throw new Error(errorMsg);
        }

        return await response.json();
    } catch(error) {
        if (error.name === 'AbortError'){
            throw new Error(`Превышен таймаут запроса (${config.requestTimeout} мс)`);
        }
        throw error;
    } finally{
        clearTimeout(timer);
    }
}


export async function getCoordinates(cityName) {
    const url = new URL(config.geocodingApiUrl);
    url.searchParams.set('name', cityName);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'ru');
    url.searchParams.set('format', 'json');

    const data = await fetchWithTimeout(url.toString());

    if (!data.results || data.results.length === 0){
        throw new Error(`Город "${cityName}" не найден`);
    }

    const result = data.results[0];
    return{
        name:result.name,
        country: result.country || 'Не указана',
        latitude: result.latitude,
        longitude: result.longitude,
    };
}

export async function getWeatherForecast(latitude, longitude, days) {
    const url = new URL(config.weatherApiUrl);
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
    url.searchParams.set('forecast_days', days);
    url.searchParams.set('timezone', 'auto');

    const data = await fetchWithTimeout(url.toString());

    if (!data.daily || !data.daily.time){
        throw new Error('Некорректные данные прогноза погоды от API');
    }

    return data.daily.time.map((date, index) =>({
        date,
        tempMax: data.daily.temperature_2m_max[index],
        tempMin: data.daily.temperature_2m_min[index],
        precipitation: data.daily.precipitation_sum[index],
    }));
}