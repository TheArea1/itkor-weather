export function displayWeatherReport(data){
    const {name, country, latitude, longitude, forecast, isFromCache} = data;

    console.log('\n--------------------------------------------------');
    console.log(`🌍 Город: ${name} (${country}) ${isFromCache ? '[из кэша]' : ''}`);
    console.log(`📍 Координаты: ${latitude}, ${longitude}`);
    console.log('--------------------------------------------------');

    const tableData = forecast.map((item) => ({
        Дата: item.date,
        'Мин. темп. (°C)': item.tempMin,
        'Макс. темп. (°C)': item.tempMax,
        'Осадки (мм)': item.precipitation,
    }));

    console.table(tableData);
}