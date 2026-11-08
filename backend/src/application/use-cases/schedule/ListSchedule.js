import { assertRange } from '../../../domain/shared/dateRange.js';

export class ListSchedule {
  constructor({ scheduleRepository }) {
    this.scheduleRepository = scheduleRepository;
  }

  async execute({ from, to }) {
    assertRange(from, to, 31);
    return this.scheduleRepository.findBetween(from, to);
  }
}
