import { ScheduleBlock } from '../../../domain/schedule/ScheduleBlock.js';
import { ValidationError } from '../../../domain/shared/DomainError.js';

const MAX_BLOCKS = 100;

/**
 * Crea uno o varios bloques de una vez (así el agente puede armar la semana en una sola llamada).
 * Valida todo antes de guardar: si un bloque es inválido, no se guarda ninguno.
 */
export class CreateBlocks {
  constructor({ scheduleRepository, recipeRepository, automationGateway }) {
    this.scheduleRepository = scheduleRepository;
    this.recipeRepository = recipeRepository;
    this.automationGateway = automationGateway;
  }

  async execute(input) {
    const items = Array.isArray(input) ? input : [input];
    if (!items.length) throw new ValidationError('Envía al menos un bloque');
    if (items.length > MAX_BLOCKS) throw new ValidationError(`Máximo ${MAX_BLOCKS} bloques por petición`);

    const blocks = items.map((item, i) => {
      try {
        return new ScheduleBlock({ ...item, id: null, createdAt: null });
      } catch (e) {
        if (items.length > 1 && e instanceof ValidationError) {
          throw new ValidationError(`Bloque ${i + 1}: ${e.message}`);
        }
        throw e;
      }
    });

    for (const block of blocks) {
      if (block.recipeId && !(await this.recipeRepository.findById(block.recipeId))) {
        throw new ValidationError(`La receta ${block.recipeId} no existe`);
      }
    }

    const saved = await this.scheduleRepository.saveMany(blocks);
    await this.automationGateway
      .publish('schedule.created', { blocks: saved.map((b) => b.toJSON()) })
      .catch(() => {});
    return saved;
  }
}
