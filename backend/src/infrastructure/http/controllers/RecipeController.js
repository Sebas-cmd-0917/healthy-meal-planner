export class RecipeController {
  constructor({ listRecipes, createRecipe }) {
    this.listRecipes = listRecipes;
    this.createRecipe = createRecipe;
  }

  list = async (_req, res) => {
    const recipes = await this.listRecipes.execute();
    res.json({ data: recipes });
  };

  create = async (req, res) => {
    const recipe = await this.createRecipe.execute(req.body ?? {});
    res.status(201).json({ data: recipe });
  };
}
