import { NotFoundError, ValidationError } from '../../../domain/shared/DomainError.js';
import type { ScheduleBlock } from '../../../domain/schedule/ScheduleBlock.js';
import type { RecipeRepository, ScheduleRepository } from '../../ports/repositories.js';
import { pickEditable } from '../shared/batch.js';

const EDITABLE = ['date', 'start', 'end', 'kind', 'title', 'notes', 'recipeId', 'exercises', 'done'] as const;

export class UpdateBlock {
  constructor(private readonly deps: { scheduleRepository: ScheduleRepository; recipeRepository: RecipeRepository }) {}

  async execute(id: string, changes: unknown): Promise<ScheduleBlock> {
    const current = await this.deps.scheduleRepository.findById(id);
    if (!current) throw new NotFoundError('El bloque no existe');

    const updated = current.with(pickEditable(changes, EDITABLE));
    if (updated.recipeId && !(await this.deps.recipeRepository.findById(updated.recipeId))) {
      throw new ValidationError(`La receta ${updated.recipeId} no existe`);
    }
    const [saved] = await this.deps.scheduleRepository.saveMany([updated]);
    return saved!;
  }
}
