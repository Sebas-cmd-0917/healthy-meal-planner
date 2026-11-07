/**
 * Puerto de salida para la agenda semanal.
 *
 * @typedef {import('../../domain/schedule/ScheduleBlock.js').ScheduleBlock} ScheduleBlock
 *
 * @typedef {Object} ScheduleRepository
 * @property {(from: string, to: string) => Promise<ScheduleBlock[]>} findBetween  Bloques entre dos fechas (incluidas), ordenados por fecha y hora
 * @property {(id: string) => Promise<ScheduleBlock|null>} findById
 * @property {(blocks: ScheduleBlock[]) => Promise<ScheduleBlock[]>} saveMany  Crea o actualiza (con sus ejercicios)
 * @property {(id: string) => Promise<boolean>} delete  true si existía
 */
export {};
