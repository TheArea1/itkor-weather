import { AppError } from '../errors/app-error.js';
import { config } from '../config.js';
import { mapDatabaseError } from '../utils/database-error.js';

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Маршрут не найден', details: [] }, requestId: req.requestId });
}

export function errorHandler(error, req, res, next) {
  let appError;
  try {
    if (error instanceof AppError) appError = error;
    else {
      try { mapDatabaseError(error); } catch (mapped) { appError = mapped instanceof AppError ? mapped : null; }
      if (!appError) {
        if (error?.type === 'entity.too.large') appError = new AppError('Тело запроса слишком большое', { status: 413, code: 'PAYLOAD_TOO_LARGE' });
        else if (error instanceof SyntaxError && error.status === 400) appError = new AppError('Некорректный JSON', { status: 400, code: 'INVALID_JSON' });
        else appError = new AppError('Внутренняя ошибка сервера');
      }
    }
  } catch {
    appError = new AppError('Внутренняя ошибка сервера');
  }

  console.error(JSON.stringify({ level: 'error', requestId: req.requestId, code: appError.code, message: error.message }));
  const message = appError.status >= 500 && config.nodeEnv === 'production' ? 'Внутренняя ошибка сервера' : appError.message;
  res.status(appError.status).json({ error: { code: appError.code, message, details: appError.details || [] }, requestId: req.requestId });
}
