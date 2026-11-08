import type { NextFunction, Request, Response } from 'express';
import { DomainError, type DomainErrorCode } from '../../../domain/shared/DomainError.js';

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  DOMAIN_ERROR: 422,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
};

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Ruta no encontrada' } });
}

/** Express 5 envía aquí los errores de los handlers async automáticamente. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DomainError) {
    res.status(STATUS_BY_CODE[err.code]).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // JSON mal formado en el body
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es JSON válido' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
}
