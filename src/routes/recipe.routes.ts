import { Router } from "express";
import {
  addFavorite,
  autocompleteRecipes,
  createRecipe,
  deleteRecipe,
  getRandomRecipes,
  getRecipeById,
  getRecipeIngredients,
  getRecipeInstructions,
  getRecipes,
  getSimilarRecipes,
  removeFavorite,
  updateRecipe,
} from "../controllers/recipe.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { addRecipeToShoppingList } from "../controllers/shopping-list.controller.js";

const router = Router();

router.post("/", createRecipe);
router.get("/", getRecipes);
router.get("/random", getRandomRecipes);
router.post("/:id/shopping-list", requireAuth, addRecipeToShoppingList);
router.get("/autocomplete", autocompleteRecipes);
router.post("/:id/favorite", requireAuth, addFavorite);
router.delete("/:id/favorite", requireAuth, removeFavorite);
router.get("/:id/ingredients", getRecipeIngredients);
router.get("/:id/instructions", getRecipeInstructions);
router.get("/:id/similar", getSimilarRecipes);
router.patch("/:id", updateRecipe);
router.delete("/:id", deleteRecipe);
router.get("/:id", getRecipeById);
export default router;
