# ITKOR Service API

REST API для учёта оборудования и заявок на его обслуживание. Данные хранятся в JSON-файле, доступ к ним выполняется только через репозиторий. Сервис использует внешний API [Open-Meteo](https://open-meteo.com/) для прогноза погоды по координатам оборудования.

## Требования

- Node.js 20+
- npm 9+

## Установка и запуск

```bash
npm install
cp .env.example .env
npm start
```

По умолчанию сервис доступен по адресу `http://localhost:3000`.

## Переменные окружения

| Переменная | Назначение | Значение по умолчанию |
|---|---|---|
| `PORT` | Порт HTTP-сервера | `3000` |
| `NODE_ENV` | Режим работы | `development` |
| `CORS_ORIGINS` | Разрешённые origins через запятую | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Окно rate limit в мс | `900000` |
| `RATE_LIMIT_MAX` | Максимум запросов к `/api` за окно | `100` |
| `WEATHER_API_URL` | URL внешнего Weather API | Open-Meteo forecast |
| `REQUEST_TIMEOUT_MS` | Таймаут Weather API в мс | `5000` |
| `DATA_FILE` | Путь к JSON-хранилищу | `data/database.json` |
| `WEATHER_MAX_WIND_SPEED` | Порог ветра для внешних работ, км/ч | `10` |

## Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | Проверка доступности |
| GET, POST | `/api/equipment` | Список и создание оборудования |
| GET, PATCH, DELETE | `/api/equipment/:id` | Оборудование по id |
| GET | `/api/equipment/:id/requests` | Заявки оборудования |
| GET | `/api/equipment/:id/weather` | Прогноз и пригодность окна работ |
| GET, POST | `/api/requests` | Список и создание заявок |
| GET, PATCH, DELETE | `/api/requests/:id` | Заявка по id |
| PATCH | `/api/requests/:id/status` | Изменение статуса заявки |

Для списков поддерживаются `page`, `limit` (1–100), `sortBy`, `order=asc|desc`, а также фильтры: оборудование — `type`, `status`, `dateFrom`, `dateTo`; заявки — `status`, `priority`, `equipmentId`, `dateFrom`, `dateTo`. Ответ списка: `{ "data": [], "meta": { "total": 0, "page": 1, "limit": 10 } }`.

## Модели

### Equipment

```json
{
  "id": "UUID генерирует сервер",
  "name": "Инвертор №1",
  "type": "inverter",
  "serialNumber": "INV-001",
  "location": { "lat": 55.75, "lon": 37.62 },
  "status": "operational",
  "installedAt": "2024-01-10",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T10:00:00.000Z"
}
```

`type`: `turbine`, `inverter`, `sensor`, `substation`. `status`: `operational`, `maintenance`, `fault`, `decommissioned`.

### Request

```json
{
  "id": "UUID генерирует сервер",
  "equipmentId": "UUID оборудования",
  "title": "Плановая диагностика",
  "description": "Проверить соединения",
  "priority": "high",
  "status": "new",
  "plannedAt": "2025-01-15T09:00:00.000Z",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T10:00:00.000Z"
}
```

`priority`: `low`, `medium`, `high`, `critical`. Переходы статусов: `new → in_progress → done`, `new → rejected`, `in_progress → rejected`; из `done` и `rejected` переходов нет.

Служебные поля `id`, `createdAt`, `updatedAt`, а также `status` при создании заявки формирует сервер. Неизвестные поля тела запроса игнорируются.

## Примеры

Создание оборудования:

```bash
curl -i -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{"name":"Инвертор №1","type":"inverter","serialNumber":"INV-001","location":{"lat":55.75,"lon":37.62},"status":"operational","installedAt":"2024-01-10"}'
```

Успешный ответ — `201 Created` с заголовком `Location` и объектом в `data`.

Некорректные данные возвращают `422`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Проверьте поля запроса",
    "details": [{ "field": "name", "message": "Строка от 3 до 100 символов" }]
  },
  "requestId": "UUID"
}
```

Также используются: `404` для отсутствующего ресурса, `409` для конфликта serialNumber/статуса/открытых заявок, `429` при превышении лимита, `503`/`504` при недоступности Weather API.

## Погода и наружные работы

`GET /api/equipment/:id/weather` передаёт координаты оборудования во внешний Open-Meteo API. День подходит для наружных работ, когда осадки равны нулю и максимальная скорость ветра **ниже** `WEATHER_MAX_WIND_SPEED`. Ошибка внешнего API возвращается в едином формате и не завершает сервер.

## Безопасность

- CORS разрешает только origins из `CORS_ORIGINS` и методы `GET`, `POST`, `PATCH`, `DELETE`; `*` не используется.
- Helmet устанавливает защитные HTTP-заголовки.
- JSON body ограничен 100 КБ.
- Все маршруты `/api` ограничены rate limit; клиент получает `429` и стандартные limit headers.
- Логи запросов содержат method, path, status, duration и requestId; ошибки пишутся без тела запросов и секретов.

## Структура

```text
src/
  routes/        HTTP-маршруты
  controllers/   HTTP-ответы
  services/      бизнес-логика и Weather API
  repositories/  JSON-хранилище
  middleware/    logging, request ID, обработка ошибок
  app.js         Express-приложение (экспортируется для тестов)
  server.js      запуск HTTP-сервера
```

Коллекция Postman с позитивными и негативными сценариями находится в `docs/postman/ITKOR Service API.postman_collection.json`.
