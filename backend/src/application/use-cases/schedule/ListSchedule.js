import { assertDate } from '../../../domain/schedule/ScheduleBlock.js';
import { ValidationError } from '../../../domain/shared/DomainError.js';

const MAX_DAYS = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

export class ListSchedule {
  constructor({ scheduleRepository }) {
    this.scheduleRepository = scheduleRepository;
  }

  async execute({ from, to }) {
    assertDate(from, 'fecha inicial');
    assertDate(to, 'fecha final');
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
    if (days < 0) throw new ValidationError('La fecha final no puede ser anterior a la inicial');
    if (days >= MAX_DAYS) throw new ValidationError(`El rango máximo es de ${MAX_DAYS} días`);
    return this.scheduleRepository.findBetween(from, to);
  }
}
