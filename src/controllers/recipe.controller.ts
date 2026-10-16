import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const getRecipes = async (req: Request, res: Response) => {
  try {
    const {
      query,
      category,
      cuisine,
      diet,
      intolerances,
      includeIngredients,
      excludeIngredients,
      type,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // -------------------------
    // Pagination
    // -------------------------

    const currentPage = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 50);

    const skip = (currentPage - 1) * pageSize;

    // -------------------------
    // Sorting
    // -------------------------

    const allowedSortFields = ["createdAt", "title", "totalTime"] as const;

    const sortField = String(sortBy);

    if (
      !allowedSortFields.includes(
        sortField as (typeof allowedSortFields)[number],
      )
    ) {
      return res.status(400).json({
        message: "Invalid sortBy. Allowed values: createdAt, title, totalTime",
      });
    }

    const sortOrder =
      String(order).toLowerCase() === "asc"
        ? "asc"
        : String(order).toLowerCase() === "desc"
          ? "desc"
          : null;

    if (!sortOrder) {
      return res.status(400).json({
        message: "Invalid order. Allowed values: asc, desc",
      });
    }

    // -------------------------
    // Where
    // -------------------------

    const where: Prisma.RecipeWhereInput = {};

    const andConditions: Prisma.RecipeWhereInput[] = [];

    // -------------------------
    // Search by recipe title
    // -------------------------

    if (query) {
      where.title = {
        contains: String(query),
        mode: "insensitive",
      };
    }
    /// category
    if (category) {
      where.categories = {
        some: {
          category: {
            name: {
              equals: String(category),
              mode: "insensitive",
            },
          },
        },
      };
    }
    // -------------------------
    // Cuisine
    // -------------------------

    if (cuisine) {
      where.cuisines = {
        some: {
          cuisine: {
            name: {
              equals: String(cuisine),
              mode: "insensitive",
            },
          },
        },
      };
    }

    // -------------------------
    // Diet
    // -------------------------

    if (diet) {
      where.diets = {
        some: {
          diet: {
            name: {
              equals: String(diet),
              mode: "insensitive",
            },
          },
        },
      };
    }

    // -------------------------
    // Meal Type
    // -------------------------

    if (type) {
      where.mealTypes = {
        some: {
          mealType: {
            name: {
              equals: String(type),
              mode: "insensitive",
            },
          },
        },
      };
    }

    // -------------------------
    // Include Ingredients
    // -------------------------

    if (includeIngredients) {
      const ingredients = String(includeIngredients)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      ingredients.forEach((ingredient) => {
        andConditions.push({
          ingredients: {
            some: {
              ingredient: {
                is: {
                  name: {
                    equals: ingredient,
                    mode: "insensitive" as Prisma.QueryMode,
                  },
                },
              },
            },
          },
        });
      });
    }

    // -------------------------
    // Exclude Ingredients
    // -------------------------

    if (excludeIngredients) {
      const ingredients = String(excludeIngredients)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      ingredients.forEach((ingredient) => {
        andConditions.push({
          NOT: {
            ingredients: {
              some: {
                ingredient: {
                  is: {
                    name: {
                      equals: ingredient,
                      mode: "insensitive" as Prisma.QueryMode,
                    },
                  },
                },
              },
            },
          },
        });
      });
    }

    // -------------------------
    // Allergies / Intolerances
    // -------------------------

    if (intolerances) {
      const allergies = String(intolerances)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      allergies.forEach((allergy) => {
        andConditions.push({
          NOT: {
            allergies: {
              some: {
                allergy: {
                  is: {
                    name: {
                      equals: allergy,
                      mode: "insensitive" as Prisma.QueryMode,
                    },
                  },
                },
              },
            },
          },
        });
      });
    }

    // -------------------------
    // Apply AND conditions
    // -------------------------

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // -------------------------
    // Get total count
    // -------------------------

    const totalResults = await prisma.recipe.count({
      where,
    });

    // -------------------------
    // Get recipes
    // -------------------------

    const recipes = await prisma.recipe.findMany({
      where,

      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },

        categories: {
          include: {
            category: true,
          },
        },

        cuisines: {
          include: {
            cuisine: true,
          },
        },

        diets: {
          include: {
            diet: true,
          },
        },

        allergies: {
          include: {
            allergy: true,
          },
        },

        mealTypes: {
          include: {
            mealType: true,
          },
        },

        equipment: {
          include: {
            equipment: true,
          },
        },

        instructions: {
          orderBy: {
            step: "asc",
          },
        },

        nutrition: true,
      },

      orderBy: {
        [sortField]: sortOrder,
      },

      skip,
      take: pageSize,
    });

    // -------------------------
    // Response
    // -------------------------

    return res.json({
      results: recipes,
      page: currentPage,
      limit: pageSize,
      totalResults,
      totalPages: Math.ceil(totalResults / pageSize),
    });
  } catch (error) {
    console.error("Get recipes error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const recipe = await prisma.recipe.findUnique({
      where: {
        id,
      },

      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },

        categories: {
          include: {
            category: true,
          },
        },

        cuisines: {
          include: {
            cuisine: true,
          },
        },

        diets: {
          include: {
            diet: true,
          },
        },

        allergies: {
          include: {
            allergy: true,
          },
        },

        mealTypes: {
          include: {
            mealType: true,
          },
        },

        equipment: {
          include: {
            equipment: true,
          },
        },

        instructions: {
          orderBy: {
            step: "asc",
          },
        },

        nutrition: true,
      },
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    return res.json({
      recipe,
    });
  } catch (error) {
    console.error("Get recipe by id error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getRecipeIngredients = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const recipe = await prisma.recipe.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    return res.json({
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      ingredients: recipe.ingredients,
    });
  } catch (error) {
    console.error("Get recipe ingredients error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getRecipeInstructions = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const recipe = await prisma.recipe.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        instructions: {
          orderBy: {
            step: "asc",
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    return res.json({
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      instructions: recipe.instructions,
    });
  } catch (error) {
    console.error("Get recipe instructions error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getSimilarRecipes = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    // -------------------------
    // Get the current recipe
    // -------------------------

    const recipe = await prisma.recipe.findUnique({
      where: {
        id,
      },
      include: {
        ingredients: {
          select: {
            ingredientId: true,
          },
        },

        categories: {
          select: {
            categoryId: true,
          },
        },

        cuisines: {
          select: {
            cuisineId: true,
          },
        },

        diets: {
          select: {
            dietId: true,
          },
        },

        mealTypes: {
          select: {
            mealTypeId: true,
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    // -------------------------
    // Extract related IDs
    // -------------------------

    const ingredientIds = recipe.ingredients.map((item) => item.ingredientId);

    const categoryIds = recipe.categories.map((item) => item.categoryId);

    const cuisineIds = recipe.cuisines.map((item) => item.cuisineId);

    const dietIds = recipe.diets.map((item) => item.dietId);

    const mealTypeIds = recipe.mealTypes.map((item) => item.mealTypeId);

    // -------------------------
    // Find candidate recipes
    // -------------------------

    const candidates = await prisma.recipe.findMany({
      where: {
        id: {
          not: id,
        },

        OR: [
          {
            ingredients: {
              some: {
                ingredientId: {
                  in: ingredientIds,
                },
              },
            },
          },

          {
            categories: {
              some: {
                categoryId: {
                  in: categoryIds,
                },
              },
            },
          },

          {
            cuisines: {
              some: {
                cuisineId: {
                  in: cuisineIds,
                },
              },
            },
          },

          {
            diets: {
              some: {
                dietId: {
                  in: dietIds,
                },
              },
            },
          },

          {
            mealTypes: {
              some: {
                mealTypeId: {
                  in: mealTypeIds,
                },
              },
            },
          },
        ],
      },

      include: {
        ingredients: {
          select: {
            ingredientId: true,
          },
        },

        categories: {
          select: {
            categoryId: true,
          },
        },

        cuisines: {
          select: {
            cuisineId: true,
          },
        },

        diets: {
          select: {
            dietId: true,
          },
        },

        mealTypes: {
          select: {
            mealTypeId: true,
          },
        },
      },
    });

    // -------------------------
    // Calculate similarity score
    // -------------------------

    const similarRecipes = candidates.map((candidate) => {
      const sharedIngredients = candidate.ingredients.filter((item) =>
        ingredientIds.includes(item.ingredientId),
      ).length;

      const sharedCategories = candidate.categories.filter((item) =>
        categoryIds.includes(item.categoryId),
      ).length;

      const sharedCuisines = candidate.cuisines.filter((item) =>
        cuisineIds.includes(item.cuisineId),
      ).length;

      const sharedDiets = candidate.diets.filter((item) =>
        dietIds.includes(item.dietId),
      ).length;

      const sharedMealTypes = candidate.mealTypes.filter((item) =>
        mealTypeIds.includes(item.mealTypeId),
      ).length;

      const score =
        sharedIngredients * 2 +
        sharedCategories * 3 +
        sharedCuisines * 3 +
        sharedDiets * 2 +
        sharedMealTypes * 1;

      return {
        id: candidate.id,
        title: candidate.title,
        slug: candidate.slug,
        description: candidate.description,
        image: candidate.image,
        totalTime: candidate.totalTime,
        servings: candidate.servings,
        score,
      };
    });

    // -------------------------
    // Sort by similarity
    // -------------------------

    similarRecipes.sort((a, b) => b.score - a.score);

    // -------------------------
    // Return top 5
    // -------------------------

    return res.json({
      recipeId: recipe.id,
      similarRecipes: similarRecipes.slice(0, 5),
    });
  } catch (error) {
    console.error("Get similar recipes error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getRandomRecipes = async (req: Request, res: Response) => {
  try {
    const countParam = Number(req.query.number ?? 1);

    const number = Math.min(Math.max(countParam, 1), 10);

    const totalRecipes = await prisma.recipe.count();

    if (totalRecipes === 0) {
      return res.json({
        recipes: [],
      });
    }

    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        prepTime: true,
        cookTime: true,
        totalTime: true,
        servings: true,
      },
    });

    // Fisher-Yates shuffle
    for (let i = recipes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      const temp = recipes[i]!;
      recipes[i] = recipes[j]!;
      recipes[j] = temp;
    }

    return res.json({
      recipes: recipes.slice(0, number),
    });
  } catch (error) {
    console.error("Get random recipes error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const autocompleteRecipes = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query ?? "").trim();

    if (!query) {
      return res.status(400).json({
        message: "Query is required",
      });
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
      },
      orderBy: {
        title: "asc",
      },
      take: 10,
    });

    return res.json({
      results: recipes,
    });
  } catch (error) {
    console.error("Autocomplete recipes error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id;

    if (typeof recipeId !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const recipe = await prisma.recipe.findUnique({
      where: {
        id: recipeId,
      },
      select: {
        id: true,
      },
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (existingFavorite) {
      return res.status(409).json({
        message: "Recipe is already in favorites",
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        recipeId,
      },
    });

    return res.status(201).json({
      message: "Recipe added to favorites",
      favorite,
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id;

    if (typeof recipeId !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (!favorite) {
      return res.status(404).json({
        message: "Recipe is not in favorites",
      });
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return res.json({
      message: "Recipe removed from favorites",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      description,
      image,
      prepTime,
      cookTime,
      totalTime,
      servings,
      vegetarian = false,
      vegan = false,
      glutenFree = false,
      dairyFree = false,
      containsAlcohol = false,
      ingredients = [],
      categories = [],
      cuisines = [],
      diets = [],
      allergies = [],
      mealTypes = [],
      equipment = [],
      instructions = [],
      nutrition,
    } = req.body;

    // Basic validation
    if (!title || !slug) {
      return res.status(400).json({
        message: "Title and slug are required",
      });
    }

    if (!Array.isArray(ingredients)) {
      return res.status(400).json({
        message: "Ingredients must be an array",
      });
    }

    if (!Array.isArray(instructions)) {
      return res.status(400).json({
        message: "Instructions must be an array",
      });
    }

    // Check duplicate slug
    const existingRecipe = await prisma.recipe.findUnique({
      where: {
        slug,
      },
    });

    if (existingRecipe) {
      return res.status(409).json({
        message: "Recipe with this slug already exists",
      });
    }

    // Validate ingredients
    if (ingredients.length > 0) {
      const ingredientIds = ingredients.map(
        (item: { ingredientId: string }) => item.ingredientId,
      );

      const existingIngredients = await prisma.ingredient.findMany({
        where: {
          id: {
            in: ingredientIds,
          },
        },
        select: {
          id: true,
        },
      });

      const existingIngredientIds = new Set(
        existingIngredients.map((item) => item.id),
      );

      const invalidIngredients = ingredientIds.filter(
        (id: string) => !existingIngredientIds.has(id),
      );

      if (invalidIngredients.length > 0) {
        return res.status(400).json({
          message: "One or more ingredient IDs are invalid",
          invalidIngredientIds: invalidIngredients,
        });
      }
    }

    const recipe = await prisma.$transaction(async (tx) => {
      // Create recipe
      const newRecipe = await tx.recipe.create({
        data: {
          title,
          slug,
          description: description ?? null,
          image: image ?? null,

          prepTime: prepTime ?? null,
          cookTime: cookTime ?? null,
          totalTime: totalTime ?? null,
          servings: servings ?? null,

          vegetarian,
          vegan,
          glutenFree,
          dairyFree,
          containsAlcohol,

          ingredients: {
            create: ingredients.map(
              (item: {
                ingredientId: string;
                amount?: number | null;
                unit?: string | null;
                preparation?: string | null;
                isOptional?: boolean;
              }) => ({
                ingredientId: item.ingredientId,
                amount: item.amount ?? null,
                unit: item.unit ?? null,
                preparation: item.preparation ?? null,
                isOptional: item.isOptional ?? false,
              }),
            ),
          },

          instructions: {
            create: instructions.map(
              (item: {
                step: number;
                text: string;
                section?: string | null;
              }) => ({
                step: item.step,
                text: item.text,
                section: item.section ?? null,
              }),
            ),
          },

          ...(nutrition
            ? {
                nutrition: {
                  create: {
                    calories: nutrition.calories ?? null,
                    protein: nutrition.protein ?? null,
                    fat: nutrition.fat ?? null,
                    carbs: nutrition.carbs ?? null,
                    fiber: nutrition.fiber ?? null,
                    sugar: nutrition.sugar ?? null,
                    sodium: nutrition.sodium ?? null,
                  },
                },
              }
            : {}),
        },
      });

      // Categories
      for (const name of categories) {
        const category = await tx.category.findUnique({
          where: { name },
        });

        if (!category) {
          throw new Error(`Category not found: ${name}`);
        }

        await tx.recipeCategory.create({
          data: {
            recipeId: newRecipe.id,
            categoryId: category.id,
          },
        });
      }

      // Cuisines
      for (const name of cuisines) {
        const cuisine = await tx.cuisine.findUnique({
          where: { name },
        });

        if (!cuisine) {
          throw new Error(`Cuisine not found: ${name}`);
        }

        await tx.recipeCuisine.create({
          data: {
            recipeId: newRecipe.id,
            cuisineId: cuisine.id,
          },
        });
      }

      // Diets
      for (const name of diets) {
        const diet = await tx.diet.findUnique({
          where: { name },
        });

        if (!diet) {
          throw new Error(`Diet not found: ${name}`);
        }

        await tx.recipeDiet.create({
          data: {
            recipeId: newRecipe.id,
            dietId: diet.id,
          },
        });
      }

      // Allergies
      for (const name of allergies) {
        const allergy = await tx.allergy.findUnique({
          where: { name },
        });

        if (!allergy) {
          throw new Error(`Allergy not found: ${name}`);
        }

        await tx.recipeAllergy.create({
          data: {
            recipeId: newRecipe.id,
            allergyId: allergy.id,
          },
        });
      }

      // Meal types
      for (const name of mealTypes) {
        const mealType = await tx.mealType.findUnique({
          where: { name },
        });

        if (!mealType) {
          throw new Error(`Meal type not found: ${name}`);
        }

        await tx.recipeMealType.create({
          data: {
            recipeId: newRecipe.id,
            mealTypeId: mealType.id,
          },
        });
      }

      // Equipment
      for (const name of equipment) {
        const equipmentItem = await tx.equipment.findUnique({
          where: { name },
        });

        if (!equipmentItem) {
          throw new Error(`Equipment not found: ${name}`);
        }

        await tx.recipeEquipment.create({
          data: {
            recipeId: newRecipe.id,
            equipmentId: equipmentItem.id,
          },
        });
      }

      return newRecipe;
    });

    // Return complete recipe
    const completeRecipe = await prisma.recipe.findUnique({
      where: {
        id: recipe.id,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        cuisines: {
          include: {
            cuisine: true,
          },
        },
        diets: {
          include: {
            diet: true,
          },
        },
        allergies: {
          include: {
            allergy: true,
          },
        },
        mealTypes: {
          include: {
            mealType: true,
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        instructions: {
          orderBy: {
            step: "asc",
          },
        },
        nutrition: true,
      },
    });

    return res.status(201).json({
      message: "Recipe created successfully",
      recipe: completeRecipe,
    });
  } catch (error) {
    console.error("Create recipe error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id;

    if (typeof recipeId !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: {
        id: recipeId,
      },
    });

    if (!existingRecipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    const {
      title,
      slug,
      description,
      image,
      prepTime,
      cookTime,
      totalTime,
      servings,
      vegetarian,
      vegan,
      glutenFree,
      dairyFree,
      containsAlcohol,
      ingredients,
      categories,
      cuisines,
      diets,
      allergies,
      mealTypes,
      equipment,
      instructions,
      nutrition,
    } = req.body;

    // Check slug uniqueness if slug is being changed
    if (slug !== undefined && slug !== existingRecipe.slug) {
      const slugExists = await prisma.recipe.findUnique({
        where: {
          slug,
        },
      });

      if (slugExists) {
        return res.status(409).json({
          message: "Recipe with this slug already exists",
        });
      }
    }

    // Validate ingredients if provided
    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients)) {
        return res.status(400).json({
          message: "Ingredients must be an array",
        });
      }

      const ingredientIds = ingredients.map(
        (item: { ingredientId: string }) => item.ingredientId,
      );

      const existingIngredients = await prisma.ingredient.findMany({
        where: {
          id: {
            in: ingredientIds,
          },
        },
        select: {
          id: true,
        },
      });

      const existingIngredientIds = new Set(
        existingIngredients.map((item) => item.id),
      );

      const invalidIngredients = ingredientIds.filter(
        (id: string) => !existingIngredientIds.has(id),
      );

      if (invalidIngredients.length > 0) {
        return res.status(400).json({
          message: "One or more ingredient IDs are invalid",
          invalidIngredientIds: invalidIngredients,
        });
      }
    }

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // Update basic recipe information
      await tx.recipe.update({
        where: {
          id: recipeId,
        },
        data: {
          ...(title !== undefined && { title }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && {
            description,
          }),
          ...(image !== undefined && { image }),
          ...(prepTime !== undefined && { prepTime }),
          ...(cookTime !== undefined && { cookTime }),
          ...(totalTime !== undefined && { totalTime }),
          ...(servings !== undefined && { servings }),

          ...(vegetarian !== undefined && {
            vegetarian,
          }),
          ...(vegan !== undefined && { vegan }),
          ...(glutenFree !== undefined && {
            glutenFree,
          }),
          ...(dairyFree !== undefined && {
            dairyFree,
          }),
          ...(containsAlcohol !== undefined && {
            containsAlcohol,
          }),
        },
      });

      // Replace ingredients if provided
      if (ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({
          where: {
            recipeId,
          },
        });

        await tx.recipeIngredient.createMany({
          data: ingredients.map(
            (item: {
              ingredientId: string;
              amount?: number | null;
              unit?: string | null;
              preparation?: string | null;
              isOptional?: boolean;
            }) => ({
              recipeId,
              ingredientId: item.ingredientId,
              amount: item.amount ?? null,
              unit: item.unit ?? null,
              preparation: item.preparation ?? null,
              isOptional: item.isOptional ?? false,
            }),
          ),
        });
      }

      // Replace categories
      if (categories !== undefined) {
        if (!Array.isArray(categories)) {
          throw new Error("Categories must be an array");
        }

        await tx.recipeCategory.deleteMany({
          where: {
            recipeId,
          },
        });

        for (const name of categories) {
          const category = await tx.category.findUnique({
            where: { name },
          });

          if (!category) {
            throw new Error(`Category not found: ${name}`);
          }

          await tx.recipeCategory.create({
            data: {
              recipeId,
              categoryId: category.id,
            },
          });
        }
      }

      // Replace cuisines
      if (cuisines !== undefined) {
        if (!Array.isArray(cuisines)) {
          throw new Error("Cuisines must be an array");
        }

        await tx.recipeCuisine.deleteMany({
          where: {
            recipeId,
          },
        });

        for (const name of cuisines) {
          const cuisine = await tx.cuisine.findUnique({
            where: { name },
          });

          if (!cuisine) {
            throw new Error(`Cuisine not found: ${name}`);
          }

          await tx.recipeCuisine.create({
            data: {
              recipeId,
              cuisineId: cuisine.id,
            },
          });
        }
      }

      // Replace diets
      if (diets !== undefined) {
        if (!Array.isArray(diets)) {
          throw new Error("Diets must be an array");
        }

        await tx.recipeDiet.deleteMany({
          where: {
            recipeId,
          },
        });

        for (const name of diets) {
          const diet = await tx.diet.findUnique({
            where: { name },
          });

          if (!diet) {
            throw new Error(`Diet not found: ${name}`);
          }

          await tx.recipeDiet.create({
            data: {
              recipeId,
              dietId: diet.id,
            },
          });
        }
      }

      // Replace allergies
      if (allergies !== undefined) {
        if (!Array.isArray(allergies)) {
          throw new Error("Allergies must be an array");
        }

        await tx.recipeAllergy.deleteMany({
          where: {
            recipeId,
          },
        });

        for (const name of allergies) {
          const allergy = await tx.allergy.findUnique({
            where: { name },
          });

          if (!allergy) {
            throw new Error(`Allergy not found: ${name}`);
          }

          await tx.recipeAllergy.create({
            data: {
              recipeId,
              allergyId: allergy.id,
            },
          });
        }
      }

      // Replace meal types
      if (mealTypes !== undefined) {
        if (!Array.isArray(mealTypes)) {
          throw new Error("Meal types must be an array");
        }

        await tx.recipeMealType.deleteMany({
          where: {
            recipeId,
          },
        });

        for (const name of mealTypes) {
          const mealType = await tx.mealType.findUnique({
            where: { name },
          });

          if (!mealType) {
            throw new Error(`Meal type not found: ${name}`);
          }

          await tx.recipeMealType.create({
            data: {
              recipeId,
              mealTypeId: mealType.id,
            },
          });
        }
      }

      // Replace equipment
      if (equipment !== undefined) {
        if (!Array.isArray(equipment)) {
          throw new Error("Equipment must be an array");
        }

        await tx.recipeEquipment.deleteMany({
          where: {
            recipeId,
          },
        });

        for (const name of equipment) {
          const equipmentItem = await tx.equipment.findUnique({
            where: { name },
          });

          if (!equipmentItem) {
            throw new Error(`Equipment not found: ${name}`);
          }

          await tx.recipeEquipment.create({
            data: {
              recipeId,
              equipmentId: equipmentItem.id,
            },
          });
        }
      }

      // Replace instructions
      if (instructions !== undefined) {
        if (!Array.isArray(instructions)) {
          throw new Error("Instructions must be an array");
        }

        await tx.instruction.deleteMany({
          where: {
            recipeId,
          },
        });

        await tx.instruction.createMany({
          data: instructions.map(
            (item: {
              step: number;
              text: string;
              section?: string | null;
            }) => ({
              recipeId,
              step: item.step,
              text: item.text,
              section: item.section ?? null,
            }),
          ),
        });
      }

      // Replace nutrition
      if (nutrition !== undefined) {
        await tx.nutrition.deleteMany({
          where: {
            recipeId,
          },
        });

        if (nutrition !== null) {
          await tx.nutrition.create({
            data: {
              recipeId,
              calories: nutrition.calories ?? null,
              protein: nutrition.protein ?? null,
              fat: nutrition.fat ?? null,
              carbs: nutrition.carbs ?? null,
              fiber: nutrition.fiber ?? null,
              sugar: nutrition.sugar ?? null,
              sodium: nutrition.sodium ?? null,
            },
          });
        }
      }

      return tx.recipe.findUnique({
        where: {
          id: recipeId,
        },
      });
    });

    return res.json({
      message: "Recipe updated successfully",
      recipe: updatedRecipe,
    });
  } catch (error) {
    console.error("Update recipe error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id;

    if (typeof recipeId !== "string") {
      return res.status(400).json({
        message: "Invalid recipe id",
      });
    }

    const recipe = await prisma.recipe.findUnique({
      where: {
        id: recipeId,
      },
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

    await prisma.recipe.delete({
      where: {
        id: recipeId,
      },
    });

    return res.json({
      message: "Recipe deleted successfully",
      recipe,
    });
  } catch (error) {
    console.error("Delete recipe error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
