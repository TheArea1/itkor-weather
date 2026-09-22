import { AppError } from '../errors/app-error.js';
import { config } from '../config.js';

export function notFound(req, res) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Маршрут не найден', details: [] }, requestId: req.requestId }); }
export function errorHandler(error, req, res, next) {
  const appError = error instanceof AppError
    ? error
    : new AppError('Внутренняя ошибка сервера');
  console.error(JSON.stringify({ level: 'error', requestId: req.requestId, code: appError.code, message: error.message }));
  const message = appError.status >= 500 && config.nodeEnv === 'production'
    ? 'Внутренняя ошибка сервера'
    : appError.message;
  res.status(appError.status).json({
    error: { code: appError.code, message, details: appError.details || [] },
    requestId: req.requestId,
  });
}
