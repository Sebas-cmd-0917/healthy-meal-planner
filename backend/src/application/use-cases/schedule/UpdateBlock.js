import { NotFoundError, ValidationError } from '../../../domain/shared/DomainError.js';

const EDITABLE = ['date', 'start', 'end', 'kind', 'title', 'notes', 'recipeId', 'exercises', 'done'];

export class UpdateBlock {
  constructor({ scheduleRepository, recipeRepository }) {
    this.scheduleRepository = scheduleRepository;
    this.recipeRepository = recipeRepository;
  }

  async execute(id, changes = {}) {
    const current = await this.scheduleRepository.findById(id);
    if (!current) throw new NotFoundError('El bloque no existe');

    const patch = Object.fromEntries(Object.entries(changes).filter(([k]) => EDITABLE.includes(k)));
    if (!Object.keys(patch).length) throw new ValidationError(`Nada que actualizar. Campos válidos: ${EDITABLE.join(', ')}`);

    const updated = current.with(patch);
    if (updated.recipeId && !(await this.recipeRepository.findById(updated.recipeId))) {
      throw new ValidationError(`La receta ${updated.recipeId} no existe`);
    }
    const [saved] = await this.scheduleRepository.saveMany([updated]);
    return saved;
  }
}
