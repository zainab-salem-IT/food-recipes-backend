import { prisma } from "./lib/prisma.js";
import express from "express";
import cors from "cors";
import { swaggerUi, swaggerDocument } from "./swagger.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import recipeRoutes from "./routes/recipe.routes.js";
import userRoutes from "./routes/user.routes.js";
import shoppingListRoutes from "./routes/shopping-list.routes.js";
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shopping-list", shoppingListRoutes);
app.get("/api/test-db", async (_req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.json({
      message: "Database connection works",
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});
export default app;