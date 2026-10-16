
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  addRecipeToQueue,
  deletePlannedMeal,
  getPlannedMeals,
  getPlanningQueue,
  removeRecipeFromQueue,
  scheduleRecipe,
  updatePlannedMeal,
} from "../controllers/planner-controller.js";

const router = Router();

router.use(requireAuth);

router.post("/queue/:recipeId", addRecipeToQueue);
router.get("/queue", getPlanningQueue);
router.delete("/queue/:recipeId", removeRecipeFromQueue);
router.post("/queue/:recipeId/schedule", scheduleRecipe);
router.get("/meals", getPlannedMeals);
router.patch("/meals/:plannedMealId", updatePlannedMeal);
router.delete("/meals/:plannedMealId", deletePlannedMeal);
export default router;
