import { InMemoryRecipeRepository } from './adapters/persistence/memory/InMemoryRecipeRepository.js';
import { InMemoryScheduleRepository } from './adapters/persistence/memory/InMemoryScheduleRepository.js';
import { SupabaseRecipeRepository } from './adapters/persistence/supabase/SupabaseRecipeRepository.js';
import { SupabaseScheduleRepository } from './adapters/persistence/supabase/SupabaseScheduleRepository.js';
import { N8nWebhookGateway } from './adapters/automation/n8n/N8nWebhookGateway.js';
import { ListRecipes } from '../application/use-cases/recipe/ListRecipes.js';
import { CreateRecipe } from '../application/use-cases/recipe/CreateRecipe.js';
import { ListSchedule } from '../application/use-cases/schedule/ListSchedule.js';
import { CreateBlocks } from '../application/use-cases/schedule/CreateBlocks.js';
import { UpdateBlock } from '../application/use-cases/schedule/UpdateBlock.js';
import { DeleteBlock } from '../application/use-cases/schedule/DeleteBlock.js';

/**
 * Composition root: aquí (y solo aquí) se conectan puertos con adaptadores.
 * Se pueden inyectar overrides para tests.
 */
export function buildContainer(env, overrides = {}) {
  const useSupabase = env.persistence === 'supabase';

  const recipeRepository = overrides.recipeRepository
    ?? (useSupabase ? new SupabaseRecipeRepository(env.supabase) : new InMemoryRecipeRepository());

  const scheduleRepository = overrides.scheduleRepository
    ?? (useSupabase ? new SupabaseScheduleRepository(env.supabase) : new InMemoryScheduleRepository());

  const automationGateway = overrides.automationGateway ?? new N8nWebhookGateway(env.n8n);

  return {
    useCases: {
      listRecipes: new ListRecipes({ recipeRepository }),
      createRecipe: new CreateRecipe({ recipeRepository, automationGateway }),
      listSchedule: new ListSchedule({ scheduleRepository }),
      createBlocks: new CreateBlocks({ scheduleRepository, recipeRepository, automationGateway }),
      updateBlock: new UpdateBlock({ scheduleRepository, recipeRepository }),
      deleteBlock: new DeleteBlock({ scheduleRepository }),
    },
  };
}
