import { assertRange } from '../../../domain/shared/dateRange.js';
import type { ScheduleRepository } from '../../ports/repositories.js';

export class ListSchedule {
  constructor(private readonly deps: { scheduleRepository: ScheduleRepository }) {}

  execute(query: { from: unknown; to: unknown }) {
    const { from, to } = assertRange(query.from, query.to, 31);
    return this.deps.scheduleRepository.findBetween(from, to);
  }
}
