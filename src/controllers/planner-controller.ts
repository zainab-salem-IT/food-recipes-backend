import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

// POST /api/planner/queue/:recipeId
export const addRecipeToQueue = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.recipeId;

    if (typeof recipeId !== "string" || !recipeId.trim()) {
      return res.status(400).json({
        message: "A valid recipe ID is required",
      });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
      },
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    const queuedRecipe = await prisma.mealPlanQueue.create({
      data: {
        userId,
        recipeId,
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            image: true,
            totalTime: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Recipe added to your planning queue",
      queuedRecipe,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        message: "Recipe is already in your planning queue",
      });
    }

    console.error("Add recipe to queue error:", error);

    return res.status(500).json({
      message: "Failed to add recipe to queue",
    });
  }
};

// GET /api/planner/queue
export const getPlanningQueue = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const queue = await prisma.mealPlanQueue.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            image: true,
            totalTime: true,
            servings: true,
            vegetarian: true,
            vegan: true,
          },
        },
      },
    });

    return res.status(200).json({
      results: queue,
      totalResults: queue.length,
    });
  } catch (error) {
    console.error("Get planning queue error:", error);

    return res.status(500).json({
      message: "Failed to retrieve planning queue",
    });
  }
};

// DELETE /api/planner/queue/:recipeId
export const removeRecipeFromQueue = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.recipeId;

    if (typeof recipeId !== "string" || !recipeId.trim()) {
      return res.status(400).json({
        message: "A valid recipe ID is required",
      });
    }

    const result = await prisma.mealPlanQueue.deleteMany({
      where: {
        userId,
        recipeId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Recipe was not found in your planning queue",
      });
    }

    return res.status(200).json({
      message: "Recipe removed from your planning queue",
    });
  } catch (error) {
    console.error("Remove recipe from queue error:", error);

    return res.status(500).json({
      message: "Failed to remove recipe from queue",
    });
  }
};

// POST /api/planner/queue/:recipeId/schedule
export const scheduleRecipe = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.recipeId;
    const { date, mealTypeId } = req.body;

    if (typeof recipeId !== "string" || !recipeId.trim()) {
      return res.status(400).json({
        message: "A valid recipe ID is required",
      });
    }

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof mealTypeId !== "string" ||
      !mealTypeId.trim()
    ) {
      return res.status(400).json({
        message: "A valid date and meal type are required",
      });
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        message: "Invalid calendar date",
      });
    }

    const plannedMeal = await prisma.$transaction(async (tx) => {
      const queuedRecipe = await tx.mealPlanQueue.findFirst({
        where: { userId, recipeId },
      });

      if (!queuedRecipe) {
        return null;
      }

      const mealType = await tx.mealType.findUnique({
        where: { id: mealTypeId },
      });

      if (!mealType) {
        return "INVALID_MEAL_TYPE" as const;
      }

      const planned = await tx.plannedMeal.create({
        data: {
          userId,
          recipeId,
          date: parsedDate,
          mealTypeId,
        },
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              image: true,
              totalTime: true,
            },
          },
          mealType: true,
        },
      });

      await tx.mealPlanQueue.delete({
        where: { id: queuedRecipe.id },
      });

      return planned;
    });

    if (!plannedMeal) {
      return res.status(404).json({
        message: "Recipe was not found in your planning queue",
      });
    }

    if (plannedMeal === "INVALID_MEAL_TYPE") {
      return res.status(400).json({
        message: "Invalid meal type",
      });
    }

    return res.status(201).json({
      message: "Recipe scheduled successfully",
      plannedMeal,
    });
  } catch (error) {
    console.error("Schedule recipe error:", error);

    return res.status(500).json({
      message: "Failed to schedule recipe",
    });
  }
};

// GET /api/planner/meals?startDate=2026-10-12&endDate=2026-10-18
export const getPlannedMeals = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (typeof startDate !== "string" || typeof endDate !== "string") {
      return res.status(400).json({
        message: "startDate and endDate are required",
      });
    }

    const isValidDate = (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const parsed = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        message: "Dates must use YYYY-MM-DD format",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        message: "startDate must be before or equal to endDate",
      });
    }

    const meals = await prisma.plannedMeal.findMany({
      where: {
        userId,
        date: {
          gte: new Date(`${startDate}T00:00:00.000Z`),
          lt: new Date(
            new Date(`${endDate}T00:00:00.000Z`).getTime() +
              24 * 60 * 60 * 1000,
          ),
        },
      },
      orderBy: [{ date: "asc" }, { mealType: { name: "asc" } }],
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            image: true,
            totalTime: true,
            servings: true,
          },
        },
        mealType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      results: meals,
      totalResults: meals.length,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Get planned meals error:", error);

    return res.status(500).json({
      message: "Failed to retrieve planned meals",
    });
  }
};


 // PATCH /api/planner/meals/:plannedMealId
export const updatePlannedMeal = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user.id;
    const plannedMealId = req.params.plannedMealId;
    const { date, mealTypeId } = req.body;

    if (
      typeof plannedMealId !== "string" ||
      !plannedMealId.trim()
    ) {
      return res.status(400).json({
        message: "A valid planned meal ID is required",
      });
    }

    // Ensure at least one field was provided.
    if (date === undefined && mealTypeId === undefined) {
      return res.status(400).json({
        message: "Provide a date or mealTypeId to update",
      });
    }

    const data: {
      date?: Date;
      mealTypeId?: string;
    } = {};

    if (date !== undefined) {
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res.status(400).json({
          message: "Date must use YYYY-MM-DD format",
        });
      }

      const parsedDate = new Date(`${date}T00:00:00.000Z`);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({
          message: "Invalid calendar date",
        });
      }

      data.date = parsedDate;
    }

    if (mealTypeId !== undefined) {
      if (
        typeof mealTypeId !== "string" ||
        !mealTypeId.trim()
      ) {
        return res.status(400).json({
          message: "A valid mealTypeId is required",
        });
      }

      const mealType = await prisma.mealType.findUnique({
        where: { id: mealTypeId },
        select: { id: true },
      });

      if (!mealType) {
        return res.status(400).json({
          message: "Invalid meal type",
        });
      }

      data.mealTypeId = mealTypeId;
    }

    // Only update a meal owned by the authenticated user.
    const existingMeal = await prisma.plannedMeal.findFirst({
      where: {
        id: plannedMealId,
        userId,
      },
      select: { id: true },
    });

    if (!existingMeal) {
      return res.status(404).json({
        message: "Planned meal not found",
      });
    }

    const updatedMeal = await prisma.plannedMeal.update({
      where: { id: existingMeal.id },
      data,
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            image: true,
            totalTime: true,
          },
        },
        mealType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Planned meal updated successfully",
      plannedMeal: updatedMeal,
    });
  } catch (error) {
    console.error("Update planned meal error:", error);

    return res.status(500).json({
      message: "Failed to update planned meal",
    });
  }
};


 // DELETE /api/planner/meals/:plannedMealId
export const deletePlannedMeal = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user.id;
    const plannedMealId = req.params.plannedMealId;

    if (
      typeof plannedMealId !== "string" ||
      !plannedMealId.trim()
    ) {
      return res.status(400).json({
        message: "A valid planned meal ID is required",
      });
    }

    const result = await prisma.plannedMeal.deleteMany({
      where: {
        id: plannedMealId,
        userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Planned meal not found",
      });
    }

    return res.status(200).json({
      message: "Planned meal deleted successfully",
    });
  } catch (error) {
    console.error("Delete planned meal error:", error);

    return res.status(500).json({
      message: "Failed to delete planned meal",
    });
  }
};

