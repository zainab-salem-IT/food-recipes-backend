import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  addShoppingListItem,
  clearShoppingList,
  deleteShoppingListItem,
  getShoppingList,
  updateShoppingListItem,
} from "../controllers/shopping-list.controller.js";

const router = Router();

router.post("/", requireAuth, addShoppingListItem);
router.get("/", requireAuth, getShoppingList);
router.patch("/:id", requireAuth, updateShoppingListItem);
router.delete("/:id", requireAuth, deleteShoppingListItem);
router.delete("/", requireAuth, clearShoppingList);
export default router;