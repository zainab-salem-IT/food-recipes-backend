import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const addShoppingListItem = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { ingredientId, amount, unit } = req.body;

    if (!ingredientId) {
      return res.status(400).json({
        message: "Ingredient id is required",
      });
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: {
        id: ingredientId,
      },
    });

    if (!ingredient) {
      return res.status(404).json({
        message: "Ingredient not found",
      });
    }

    const existingItem =
      await prisma.shoppingListItem.findUnique({
        where: {
          userId_ingredientId: {
            userId,
            ingredientId,
          },
        },
      });

    if (existingItem) {
      return res.status(409).json({
        message: "Ingredient is already in shopping list",
      });
    }

    const shoppingListItem =
      await prisma.shoppingListItem.create({
        data: {
          userId,
          ingredientId,
          amount: amount ?? null,
          unit: unit ?? null,
        },
        include: {
          ingredient: true,
        },
      });

    return res.status(201).json({
      message: "Ingredient added to shopping list",
      item: shoppingListItem,
    });
  } catch (error) {
    console.error("Add shopping list item error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getShoppingList = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const items = await prisma.shoppingListItem.findMany({
      where: {
        userId,
      },
      include: {
        ingredient: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      items,
    });
  } catch (error) {
    console.error("Get shopping list error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const updateShoppingListItem = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (typeof itemId !== "string") {
      return res.status(400).json({
        message: "Invalid shopping list item id",
      });
    }

    const { isChecked, amount, unit } = req.body;

    // At least one field must be provided
    if (
      typeof isChecked !== "boolean" &&
      amount === undefined &&
      unit === undefined
    ) {
      return res.status(400).json({
        message:
          "Provide at least one field: isChecked, amount, or unit",
      });
    }

    // Validate isChecked if provided
    if (
      isChecked !== undefined &&
      typeof isChecked !== "boolean"
    ) {
      return res.status(400).json({
        message: "isChecked must be a boolean",
      });
    }

    // Validate amount if provided
    if (
      amount !== undefined &&
      amount !== null &&
      (typeof amount !== "number" || amount < 0)
    ) {
      return res.status(400).json({
        message: "Amount must be a positive number or null",
      });
    }

    // Validate unit if provided
    if (
      unit !== undefined &&
      unit !== null &&
      typeof unit !== "string"
    ) {
      return res.status(400).json({
        message: "Unit must be a string or null",
      });
    }

    const item = await prisma.shoppingListItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "Shopping list item not found",
      });
    }

    const updatedItem =
      await prisma.shoppingListItem.update({
        where: {
          id: itemId,
        },
        data: {
          ...(isChecked !== undefined && {
            isChecked,
          }),
          ...(amount !== undefined && {
            amount,
          }),
          ...(unit !== undefined && {
            unit,
          }),
        },
        include: {
          ingredient: true,
        },
      });

    return res.json({
      message: "Shopping list item updated",
      item: updatedItem,
    });
  } catch (error) {
    console.error(
      "Update shopping list item error:",
      error,
    );

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const deleteShoppingListItem = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (typeof itemId !== "string") {
      return res.status(400).json({
        message: "Invalid shopping list item id",
      });
    }

    const item = await prisma.shoppingListItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "Shopping list item not found",
      });
    }

    await prisma.shoppingListItem.delete({
      where: {
        id: itemId,
      },
    });

    return res.json({
      message: "Shopping list item deleted",
    });
  } catch (error) {
    console.error(
      "Delete shopping list item error:",
      error,
    );

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const addRecipeToShoppingList = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const recipeId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (typeof recipeId !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const recipe = await prisma.recipe.findUnique({
      where: {
        id: recipeId,
      },
      include: {
        ingredients: true,
      },
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    if (recipe.ingredients.length === 0) {
      return res.status(400).json({
        message: "Recipe has no ingredients",
      });
    }

    const ingredientIds = recipe.ingredients.map(
      (item) => item.ingredientId,
    );

    const existingItems =
      await prisma.shoppingListItem.findMany({
        where: {
          userId,
          ingredientId: {
            in: ingredientIds,
          },
        },
        select: {
          ingredientId: true,
        },
      });

    const existingIngredientIds = new Set(
      existingItems.map((item) => item.ingredientId),
    );

    const newIngredients = recipe.ingredients.filter(
      (item) =>
        !existingIngredientIds.has(item.ingredientId),
    );

    if (newIngredients.length === 0) {
      return res.status(409).json({
        message:
          "All recipe ingredients are already in shopping list",
      });
    }

    const items = await prisma.$transaction(
      newIngredients.map((item) =>
        prisma.shoppingListItem.create({
          data: {
            userId,
            ingredientId: item.ingredientId,
            amount: item.amount,
            unit: item.unit,
          },
          include: {
            ingredient: true,
          },
        }),
      ),
    );

    return res.status(201).json({
      message: "Recipe ingredients added to shopping list",
      recipe: {
        id: recipe.id,
        title: recipe.title,
      },
      addedCount: items.length,
      items,
    });
  } catch (error) {
    console.error(
      "Add recipe to shopping list error:",
      error,
    );

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const clearShoppingList = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result =
      await prisma.shoppingListItem.deleteMany({
        where: {
          userId,
        },
      });

    return res.json({
      message: "Shopping list cleared",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error(
      "Clear shopping list error:",
      error,
    );

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};