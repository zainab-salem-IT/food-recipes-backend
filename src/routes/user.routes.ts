import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { getMyFavorites } from "../controllers/user.controller.js";

const router = Router();

router.get("/me/favorites", requireAuth, getMyFavorites);

export default router;