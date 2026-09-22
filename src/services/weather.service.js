import { config } from '../config.js';
import { AppError } from '../errors/app-error.js';

export async function getEquipmentWeather(location) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const url = new URL(config.weatherApiUrl);
    url.search = new URLSearchParams({ latitude: location.lat, longitude: location.lon, daily: 'precipitation_sum,wind_speed_10m_max', forecast_days: '7', timezone: 'auto' }).toString();
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new AppError('Погодный сервис временно недоступен', { status: 503, code: 'WEATHER_UNAVAILABLE' });
    const payload = await response.json();
    if (!payload.daily?.time) throw new AppError('Погодный сервис вернул некорректные данные', { status: 502, code: 'WEATHER_INVALID_RESPONSE' });
    const forecast = payload.daily.time.map((date, index) => { const precipitation = payload.daily.precipitation_sum[index]; const windSpeed = payload.daily.wind_speed_10m_max[index]; return { date, precipitation, windSpeed, suitableForOutdoorWork: precipitation === 0 && windSpeed < config.weatherMaxWindSpeed }; });
    return { forecast, rule: `Осадки отсутствуют, максимальная скорость ветра ниже ${config.weatherMaxWindSpeed} км/ч` };
  } catch (error) {
    if (error.name === 'AbortError') throw new AppError('Превышен таймаут погодного сервиса', { status: 504, code: 'WEATHER_TIMEOUT' });
    throw error;
  } finally { clearTimeout(timeout); }
}
