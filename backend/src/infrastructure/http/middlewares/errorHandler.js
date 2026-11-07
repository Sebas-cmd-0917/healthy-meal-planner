import { DomainError } from '../../../domain/shared/DomainError.js';

const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
};

export function notFound(_req, res) {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Ruta no encontrada' } });
}

// Express 5 envía aquí los errores de los handlers async automáticamente
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof DomainError) {
    return res.status(STATUS_BY_CODE[err.code] ?? 422).json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
}
