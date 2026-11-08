import { ScheduleBlock } from '../../../domain/schedule/ScheduleBlock.js';
import { ValidationError } from '../../../domain/shared/DomainError.js';
import type { AutomationGateway } from '../../ports/AutomationGateway.js';
import type { RecipeRepository, ScheduleRepository } from '../../ports/repositories.js';
import { buildAll } from '../shared/batch.js';

interface Deps {
  scheduleRepository: ScheduleRepository;
  recipeRepository: RecipeRepository;
  automationGateway: AutomationGateway;
}

/**
 * Crea uno o varios bloques de una vez (así el agente puede armar la semana en una sola llamada).
 * Valida todo antes de guardar: si un bloque es inválido, no se guarda ninguno.
 */
export class CreateBlocks {
  constructor(private readonly deps: Deps) {}

  async execute(input: unknown): Promise<ScheduleBlock[]> {
    const blocks = buildAll(input, (item) => new ScheduleBlock({ ...item, id: null, createdAt: null }), { label: 'Bloque' });

    for (const block of blocks) {
      if (block.recipeId && !(await this.deps.recipeRepository.findById(block.recipeId))) {
        throw new ValidationError(`La receta ${block.recipeId} no existe`);
      }
    }

    const saved = await this.deps.scheduleRepository.saveMany(blocks);
    await this.deps.automationGateway
      .publish('schedule.created', { blocks: saved.map((b) => b.toJSON()) })
      .catch(() => {});
    return saved;
  }
}
