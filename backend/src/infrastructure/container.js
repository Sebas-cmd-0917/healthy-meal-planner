import { InMemoryRecipeRepository } from './adapters/persistence/memory/InMemoryRecipeRepository.js';
import { SupabaseRecipeRepository } from './adapters/persistence/supabase/SupabaseRecipeRepository.js';
import { N8nWebhookGateway } from './adapters/automation/n8n/N8nWebhookGateway.js';
import { ListRecipes } from '../application/use-cases/recipe/ListRecipes.js';
import { CreateRecipe } from '../application/use-cases/recipe/CreateRecipe.js';

/**
 * Composition root: aquí (y solo aquí) se conectan puertos con adaptadores.
 * Se pueden inyectar overrides para tests.
 */
export function buildContainer(env, overrides = {}) {
  const recipeRepository = overrides.recipeRepository
    ?? (env.persistence === 'supabase'
      ? new SupabaseRecipeRepository(env.supabase)
      : new InMemoryRecipeRepository());

  const automationGateway = overrides.automationGateway ?? new N8nWebhookGateway(env.n8n);

  return {
    useCases: {
      listRecipes: new ListRecipes({ recipeRepository }),
      createRecipe: new CreateRecipe({ recipeRepository, automationGateway }),
    },
  };
}
