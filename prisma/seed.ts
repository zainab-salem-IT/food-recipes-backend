import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

type RecipeSeed = {
  title: string;
  slug: string;
  description: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  containsAlcohol?: boolean;

  category: string;
  cuisine: string;
  mealType: string;

  diets?: string[];
  allergies?: string[];
  equipment?: string[];

  ingredients: {
    name: string;
    amount: number;
    unit: string;
    preparation?: string;
    isOptional?: boolean;
  }[];

  instructions: string[];

  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
};

// --------------------------------------------------
// Helper functions
// --------------------------------------------------

async function getOrCreateIngredient(name: string) {
  return prisma.ingredient.upsert({
    where: { name },
    update: {},
    create: {
      name,
      normalizedName: name.toLowerCase(),
    },
  });
}

async function getCategory(name: string) {
  const category = await prisma.category.findUnique({
    where: { name },
  });

  if (!category) {
    throw new Error(`Category "${name}" not found`);
  }

  return category;
}

async function getCuisine(name: string) {
  const cuisine = await prisma.cuisine.findUnique({
    where: { name },
  });

  if (!cuisine) {
    throw new Error(`Cuisine "${name}" not found`);
  }

  return cuisine;
}

async function getDiet(name: string) {
  const diet = await prisma.diet.findUnique({
    where: { name },
  });

  if (!diet) {
    throw new Error(`Diet "${name}" not found`);
  }

  return diet;
}

async function getAllergy(name: string) {
  const allergy = await prisma.allergy.findUnique({
    where: { name },
  });

  if (!allergy) {
    throw new Error(`Allergy "${name}" not found`);
  }

  return allergy;
}

async function getMealType(name: string) {
  const mealType = await prisma.mealType.findUnique({
    where: { name },
  });

  if (!mealType) {
    throw new Error(`Meal type "${name}" not found`);
  }

  return mealType;
}

async function getEquipment(name: string) {
  const equipment = await prisma.equipment.findUnique({
    where: { name },
  });

  if (!equipment) {
    throw new Error(`Equipment "${name}" not found`);
  }

  return equipment;
}

// --------------------------------------------------
// Seed one complete recipe
// --------------------------------------------------

async function seedRecipe(data: RecipeSeed) {
  const totalTime = data.prepTime + data.cookTime;

  const recipe = await prisma.recipe.upsert({
    where: {
      slug: data.slug,
    },
    update: {
      image: data.image
    },
    create: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      image: data.image,

      prepTime: data.prepTime,
      cookTime: data.cookTime,
      totalTime,
      servings: data.servings,

      vegetarian: data.vegetarian,
      vegan: data.vegan,
      glutenFree: data.glutenFree,
      dairyFree: data.dairyFree,
      containsAlcohol: data.containsAlcohol ?? false,
    },
  });

  // ------------------------------------------------
  // Ingredients
  // ------------------------------------------------

  for (const item of data.ingredients) {
    const ingredient = await getOrCreateIngredient(item.name);

    await prisma.recipeIngredient.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
        },
      },
      update: {
        amount: item.amount,
        unit: item.unit,
        preparation: item.preparation,
        isOptional: item.isOptional ?? false,
      },
      create: {
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: item.amount,
        unit: item.unit,
        preparation: item.preparation,
        isOptional: item.isOptional ?? false,
      },
    });
  }

  // ------------------------------------------------
  // Category
  // ------------------------------------------------

  const category = await getCategory(data.category);

  await prisma.recipeCategory.upsert({
    where: {
      recipeId_categoryId: {
        recipeId: recipe.id,
        categoryId: category.id,
      },
    },
    update: {},
    create: {
      recipeId: recipe.id,
      categoryId: category.id,
    },
  });

  // ------------------------------------------------
  // Cuisine
  // ------------------------------------------------

  const cuisine = await getCuisine(data.cuisine);

  await prisma.recipeCuisine.upsert({
    where: {
      recipeId_cuisineId: {
        recipeId: recipe.id,
        cuisineId: cuisine.id,
      },
    },
    update: {},
    create: {
      recipeId: recipe.id,
      cuisineId: cuisine.id,
    },
  });

  // ------------------------------------------------
  // Meal Type
  // ------------------------------------------------

  const mealType = await getMealType(data.mealType);

  await prisma.recipeMealType.upsert({
    where: {
      recipeId_mealTypeId: {
        recipeId: recipe.id,
        mealTypeId: mealType.id,
      },
    },
    update: {},
    create: {
      recipeId: recipe.id,
      mealTypeId: mealType.id,
    },
  });

  // ------------------------------------------------
  // Diets
  // ------------------------------------------------

  for (const dietName of data.diets ?? []) {
    const diet = await getDiet(dietName);

    await prisma.recipeDiet.upsert({
      where: {
        recipeId_dietId: {
          recipeId: recipe.id,
          dietId: diet.id,
        },
      },
      update: {},
      create: {
        recipeId: recipe.id,
        dietId: diet.id,
      },
    });
  }

  // ------------------------------------------------
  // Allergies
  // ------------------------------------------------

  for (const allergyName of data.allergies ?? []) {
    const allergy = await getAllergy(allergyName);

    await prisma.recipeAllergy.upsert({
      where: {
        recipeId_allergyId: {
          recipeId: recipe.id,
          allergyId: allergy.id,
        },
      },
      update: {},
      create: {
        recipeId: recipe.id,
        allergyId: allergy.id,
      },
    });
  }

  // ------------------------------------------------
  // Equipment
  // ------------------------------------------------

  for (const equipmentName of data.equipment ?? []) {
    const equipment = await getEquipment(equipmentName);

    await prisma.recipeEquipment.upsert({
      where: {
        recipeId_equipmentId: {
          recipeId: recipe.id,
          equipmentId: equipment.id,
        },
      },
      update: {},
      create: {
        recipeId: recipe.id,
        equipmentId: equipment.id,
      },
    });
  }

  // ------------------------------------------------
  // Instructions
  // ------------------------------------------------

  for (let i = 0; i < data.instructions.length; i++) {
    await prisma.instruction.upsert({
      where: {
        recipeId_step: {
          recipeId: recipe.id,
          step: i + 1,
        },
      },
      update: {
        text: data.instructions[i],
      },
      create: {
        recipeId: recipe.id,
        step: i + 1,
        text: data.instructions[i],
      },
    });
  }

  // ------------------------------------------------
  // Nutrition
  // ------------------------------------------------

  await prisma.nutrition.upsert({
    where: {
      recipeId: recipe.id,
    },
    update: {},
    create: {
      recipeId: recipe.id,
      calories: data.nutrition.calories,
      protein: data.nutrition.protein,
      fat: data.nutrition.fat,
      carbs: data.nutrition.carbs,
      fiber: data.nutrition.fiber,
      sugar: data.nutrition.sugar,
      sodium: data.nutrition.sodium,
    },
  });

  console.log(`✅ ${data.title}`);

  return recipe;
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log("🌱 Starting database seed...");

  // ------------------------------------------------
  // Categories
  // ------------------------------------------------

  const categories = [
    "Pasta",
    "Pizza",
    "Salad",
    "Soup",
    "Dessert",
    "Breakfast",
    "Main Course",
    "Appetizer",
    "Snack",
    "Side Dish",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ------------------------------------------------
  // Cuisines
  // ------------------------------------------------

  const cuisines = [
    "Italian",
    "American",
    "Mexican",
    "Indian",
    "Chinese",
    "Japanese",
    "Mediterranean",
    "Middle Eastern",
    "French",
    "Thai",
  ];

  for (const name of cuisines) {
    await prisma.cuisine.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ------------------------------------------------
  // Diets
  // ------------------------------------------------

  const diets = [
    "Vegetarian",
    "Vegan",
    "Keto",
    "Paleo",
    "Gluten Free",
    "Low Carb",
    "High Protein",
  ];

  for (const name of diets) {
    await prisma.diet.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ------------------------------------------------
  // Allergies
  // ------------------------------------------------

  const allergies = [
    "Gluten",
    "Dairy",
    "Egg",
    "Peanut",
    "Tree Nut",
    "Soy",
    "Fish",
    "Shellfish",
    "Sesame",
  ];

  for (const name of allergies) {
    await prisma.allergy.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ------------------------------------------------
  // Meal Types
  // ------------------------------------------------

  const mealTypes = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snack",
    "Dessert",
    "Appetizer",
  ];

  for (const name of mealTypes) {
    await prisma.mealType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ------------------------------------------------
  // Equipment
  // ------------------------------------------------

  const equipment = [
    "Oven",
    "Stove",
    "Pan",
    "Pot",
    "Blender",
    "Microwave",
    "Air Fryer",
    "Food Processor",
    "Grill",
  ];

  for (const name of equipment) {
    await prisma.equipment.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ------------------------------------------------
  // Recipes
  // ------------------------------------------------

  const recipes: RecipeSeed[] = [
    // 1
    {
      title: "Creamy Chicken Pasta",
      slug: "creamy-chicken-pasta",
      description:
        "A creamy and comforting pasta dish with tender chicken, garlic, and parmesan cheese.",
      image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb",
      prepTime: 10,
      cookTime: 25,
      servings: 4,

      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,

      category: "Pasta",
      cuisine: "Italian",
      mealType: "Dinner",
      diets: ["High Protein"],
      allergies: ["Dairy", "Gluten"],
      equipment: ["Pan", "Pot"],

      ingredients: [
        { name: "Chicken", amount: 500, unit: "g" },
        { name: "Pasta", amount: 300, unit: "g" },
        { name: "Garlic", amount: 3, unit: "cloves" },
        { name: "Parmesan Cheese", amount: 100, unit: "g" },
        { name: "Cream", amount: 200, unit: "ml" },
        { name: "Olive Oil", amount: 2, unit: "tbsp" },
        { name: "Salt", amount: 1, unit: "tsp" },
        { name: "Black Pepper", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Cook the pasta according to the package instructions until al dente.",
        "Cut the chicken into small pieces and season with salt and black pepper.",
        "Heat olive oil in a pan and cook the chicken until golden and fully cooked.",
        "Add minced garlic and cook for about one minute.",
        "Add cream and parmesan cheese and stir until creamy.",
        "Add the cooked pasta and mix everything together.",
        "Serve immediately with extra parmesan cheese if desired.",
      ],

      nutrition: {
        calories: 620,
        protein: 42,
        fat: 24,
        carbs: 58,
        fiber: 4,
        sugar: 5,
        sodium: 480,
      },
    },

    // 2
    {
      title: "Margherita Pizza",
      slug: "margherita-pizza",
      description:
        "Classic Italian pizza topped with tomato sauce, mozzarella, fresh basil, and olive oil.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
      prepTime: 20,
      cookTime: 15,
      servings: 2,

      vegetarian: true,
      vegan: false,
      glutenFree: false,
      dairyFree: false,

      category: "Pizza",
      cuisine: "Italian",
      mealType: "Dinner",
      allergies: ["Gluten", "Dairy"],
      equipment: ["Oven"],

      ingredients: [
        { name: "Flour", amount: 250, unit: "g" },
        { name: "Tomato", amount: 200, unit: "g" },
        { name: "Mozzarella Cheese", amount: 150, unit: "g" },
        { name: "Basil", amount: 10, unit: "leaves" },
        { name: "Olive Oil", amount: 1, unit: "tbsp" },
        { name: "Salt", amount: 1, unit: "tsp" },
      ],

      instructions: [
        "Prepare the pizza dough and let it rest.",
        "Spread tomato sauce over the dough.",
        "Add mozzarella cheese and fresh basil.",
        "Drizzle with olive oil.",
        "Bake in a very hot oven until the crust is golden.",
        "Slice and serve warm.",
      ],

      nutrition: {
        calories: 540,
        protein: 22,
        fat: 18,
        carbs: 70,
        fiber: 4,
        sugar: 6,
        sodium: 720,
      },
    },

    // 3
    {
      title: "Greek Salad",
      slug: "greek-salad",
      description:
        "A fresh Mediterranean salad with tomatoes, cucumber, onion, olives, and feta cheese.",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
      prepTime: 15,
      cookTime: 0,
      servings: 2,

      vegetarian: true,
      vegan: false,
      glutenFree: true,
      dairyFree: false,

      category: "Salad",
      cuisine: "Mediterranean",
      mealType: "Lunch",
      allergies: ["Dairy"],
      equipment: [],

      ingredients: [
        { name: "Tomato", amount: 300, unit: "g" },
        { name: "Cucumber", amount: 1, unit: "piece" },
        { name: "Onion", amount: 0.5, unit: "piece" },
        { name: "Feta Cheese", amount: 100, unit: "g" },
        { name: "Olives", amount: 80, unit: "g" },
        { name: "Olive Oil", amount: 2, unit: "tbsp" },
        { name: "Lemon", amount: 1, unit: "piece" },
        { name: "Salt", amount: 0.5, unit: "tsp" },
        { name: "Black Pepper", amount: 0.25, unit: "tsp" },
      ],

      instructions: [
        "Chop the tomatoes, cucumber, and onion.",
        "Place the vegetables in a large bowl.",
        "Add feta cheese and olives.",
        "Add olive oil and lemon juice.",
        "Season with salt and black pepper.",
        "Toss everything together and serve fresh.",
      ],

      nutrition: {
        calories: 290,
        protein: 9,
        fat: 21,
        carbs: 18,
        fiber: 5,
        sugar: 8,
        sodium: 520,
      },
    },

    // 4
    {
      title: "Creamy Tomato Soup",
      slug: "creamy-tomato-soup",
      description:
        "A warm and comforting tomato soup blended with cream and herbs.",
      image: "https://images.unsplash.com/photo-1547592180-85f173990554",
      prepTime: 10,
      cookTime: 25,
      servings: 4,

      vegetarian: true,
      vegan: false,
      glutenFree: true,
      dairyFree: false,

      category: "Soup",
      cuisine: "American",
      mealType: "Lunch",
      allergies: ["Dairy"],
      equipment: ["Pot", "Blender"],

      ingredients: [
        { name: "Tomato", amount: 700, unit: "g" },
        { name: "Onion", amount: 1, unit: "piece" },
        { name: "Garlic", amount: 2, unit: "cloves" },
        { name: "Cream", amount: 100, unit: "ml" },
        { name: "Olive Oil", amount: 1, unit: "tbsp" },
        { name: "Basil", amount: 1, unit: "tsp" },
        { name: "Salt", amount: 1, unit: "tsp" },
      ],

      instructions: [
        "Heat olive oil in a pot.",
        "Cook onion and garlic until soft.",
        "Add chopped tomatoes and simmer.",
        "Blend the soup until smooth.",
        "Add cream and basil.",
        "Season with salt and serve hot.",
      ],

      nutrition: {
        calories: 190,
        protein: 5,
        fat: 11,
        carbs: 20,
        fiber: 4,
        sugar: 10,
        sodium: 420,
      },
    },

    // 5
    {
      title: "Pancakes",
      slug: "classic-pancakes",
      description:
        "Fluffy homemade pancakes perfect for a delicious breakfast.",
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93",
      prepTime: 10,
      cookTime: 15,
      servings: 4,

      vegetarian: true,
      vegan: false,
      glutenFree: false,
      dairyFree: false,

      category: "Breakfast",
      cuisine: "American",
      mealType: "Breakfast",
      allergies: ["Gluten", "Dairy", "Egg"],
      equipment: ["Pan"],

      ingredients: [
        { name: "Flour", amount: 200, unit: "g" },
        { name: "Milk", amount: 250, unit: "ml" },
        { name: "Egg", amount: 2, unit: "pieces" },
        { name: "Butter", amount: 30, unit: "g" },
        { name: "Salt", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Mix flour and salt in a bowl.",
        "Add milk and eggs and whisk until smooth.",
        "Melt butter in a pan.",
        "Pour a small amount of batter into the pan.",
        "Cook until bubbles appear, then flip.",
        "Cook the other side until golden.",
      ],

      nutrition: {
        calories: 360,
        protein: 11,
        fat: 14,
        carbs: 45,
        fiber: 2,
        sugar: 7,
        sodium: 410,
      },
    },

    // 6
    {
      title: "Chicken Tacos",
      slug: "chicken-tacos",
      description:
        "Flavorful Mexican-style chicken tacos with fresh vegetables and herbs.",
      image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b",
      prepTime: 15,
      cookTime: 20,
      servings: 4,

      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: true,

      category: "Main Course",
      cuisine: "Mexican",
      mealType: "Dinner",
      diets: ["High Protein"],
      allergies: ["Gluten"],
      equipment: ["Pan"],

      ingredients: [
        { name: "Chicken", amount: 400, unit: "g" },
        { name: "Tomato", amount: 150, unit: "g" },
        { name: "Onion", amount: 1, unit: "piece" },
        { name: "Olive Oil", amount: 1, unit: "tbsp" },
        { name: "Lemon", amount: 1, unit: "piece" },
        { name: "Salt", amount: 1, unit: "tsp" },
        { name: "Black Pepper", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Cut chicken into small pieces.",
        "Season with salt and black pepper.",
        "Cook chicken in olive oil until fully cooked.",
        "Add chopped onion and tomato.",
        "Cook until vegetables soften.",
        "Finish with fresh lemon juice.",
      ],

      nutrition: {
        calories: 430,
        protein: 38,
        fat: 16,
        carbs: 38,
        fiber: 5,
        sugar: 6,
        sodium: 620,
      },
    },

    // 7
    {
      title: "Vegetable Fried Rice",
      slug: "vegetable-fried-rice",
      description:
        "Quick fried rice loaded with colorful vegetables and aromatic garlic.",
      image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
      prepTime: 10,
      cookTime: 15,
      servings: 3,

      vegetarian: true,
      vegan: true,
      glutenFree: false,
      dairyFree: true,

      category: "Main Course",
      cuisine: "Chinese",
      mealType: "Lunch",
      diets: ["Vegan"],
      equipment: ["Pan"],

      ingredients: [
        { name: "Rice", amount: 400, unit: "g" },
        { name: "Carrot", amount: 1, unit: "piece" },
        { name: "Onion", amount: 1, unit: "piece" },
        { name: "Garlic", amount: 2, unit: "cloves" },
        { name: "Olive Oil", amount: 2, unit: "tbsp" },
        { name: "Black Pepper", amount: 0.5, unit: "tsp" },
        { name: "Salt", amount: 1, unit: "tsp" },
      ],

      instructions: [
        "Cook the rice and let it cool.",
        "Heat oil in a large pan.",
        "Cook onion, carrot, and garlic.",
        "Add the cooked rice.",
        "Season with salt and black pepper.",
        "Stir-fry everything over high heat.",
      ],

      nutrition: {
        calories: 390,
        protein: 8,
        fat: 10,
        carbs: 68,
        fiber: 4,
        sugar: 5,
        sodium: 460,
      },
    },

    // 8
    {
      title: "Butter Chicken",
      slug: "butter-chicken",
      description:
        "Rich Indian-style chicken cooked in a creamy tomato sauce with aromatic spices.",
      image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
      prepTime: 20,
      cookTime: 35,
      servings: 4,

      vegetarian: false,
      vegan: false,
      glutenFree: true,
      dairyFree: false,

      category: "Main Course",
      cuisine: "Indian",
      mealType: "Dinner",
      diets: ["High Protein"],
      allergies: ["Dairy"],
      equipment: ["Pan", "Pot"],

      ingredients: [
        { name: "Chicken", amount: 600, unit: "g" },
        { name: "Tomato", amount: 300, unit: "g" },
        { name: "Butter", amount: 40, unit: "g" },
        { name: "Cream", amount: 150, unit: "ml" },
        { name: "Garlic", amount: 3, unit: "cloves" },
        { name: "Onion", amount: 1, unit: "piece" },
        { name: "Salt", amount: 1, unit: "tsp" },
      ],

      instructions: [
        "Cut chicken into bite-sized pieces.",
        "Cook onion and garlic in butter.",
        "Add chicken and cook until browned.",
        "Add tomatoes and simmer until soft.",
        "Blend the sauce until smooth.",
        "Add cream and return the chicken to the sauce.",
        "Simmer until the chicken is fully cooked.",
      ],

      nutrition: {
        calories: 570,
        protein: 45,
        fat: 34,
        carbs: 18,
        fiber: 3,
        sugar: 8,
        sodium: 650,
      },
    },

    // 9
    {
      title: "Mushroom Risotto",
      slug: "mushroom-risotto",
      description:
        "Creamy Italian risotto made with mushrooms, parmesan, and fresh herbs.",
      image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371",
      prepTime: 10,
      cookTime: 30,
      servings: 4,

      vegetarian: true,
      vegan: false,
      glutenFree: true,
      dairyFree: false,

      category: "Main Course",
      cuisine: "Italian",
      mealType: "Dinner",
      allergies: ["Dairy"],
      equipment: ["Pot", "Pan"],

      ingredients: [
        { name: "Rice", amount: 300, unit: "g" },
        { name: "Mushroom", amount: 250, unit: "g" },
        { name: "Onion", amount: 1, unit: "piece" },
        { name: "Garlic", amount: 2, unit: "cloves" },
        { name: "Parmesan Cheese", amount: 80, unit: "g" },
        { name: "Butter", amount: 30, unit: "g" },
        { name: "Olive Oil", amount: 1, unit: "tbsp" },
      ],

      instructions: [
        "Slice the mushrooms.",
        "Cook onion and garlic in olive oil.",
        "Add mushrooms and cook until golden.",
        "Add rice and toast for two minutes.",
        "Gradually add warm liquid while stirring.",
        "Continue cooking until the rice becomes creamy.",
        "Stir in butter and parmesan before serving.",
      ],

      nutrition: {
        calories: 450,
        protein: 13,
        fat: 18,
        carbs: 62,
        fiber: 4,
        sugar: 4,
        sodium: 520,
      },
    },

    // 10
    {
      title: "Avocado Toast",
      slug: "avocado-toast",
      description:
        "Simple and healthy toast topped with creamy avocado and fresh lemon.",
      image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d",
      prepTime: 5,
      cookTime: 5,
      servings: 2,

      vegetarian: true,
      vegan: true,
      glutenFree: false,
      dairyFree: true,

      category: "Breakfast",
      cuisine: "American",
      mealType: "Breakfast",
      diets: ["Vegan"],
      allergies: ["Gluten"],
      equipment: [],

      ingredients: [
        { name: "Bread", amount: 2, unit: "slices" },
        { name: "Avocado", amount: 1, unit: "piece" },
        { name: "Lemon", amount: 0.5, unit: "piece" },
        { name: "Olive Oil", amount: 1, unit: "tsp" },
        { name: "Salt", amount: 0.25, unit: "tsp" },
        { name: "Black Pepper", amount: 0.25, unit: "tsp" },
      ],

      instructions: [
        "Toast the bread.",
        "Mash the avocado with lemon juice.",
        "Season with salt and black pepper.",
        "Spread avocado over the toast.",
        "Drizzle with olive oil and serve.",
      ],

      nutrition: {
        calories: 280,
        protein: 6,
        fat: 17,
        carbs: 30,
        fiber: 7,
        sugar: 2,
        sodium: 320,
      },
    },

    // 11
    {
      title: "Chicken Caesar Salad",
      slug: "chicken-caesar-salad",
      description:
        "Crisp lettuce topped with grilled chicken, parmesan, and creamy dressing.",
      image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
      prepTime: 15,
      cookTime: 15,
      servings: 2,

      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,

      category: "Salad",
      cuisine: "American",
      mealType: "Lunch",
      diets: ["High Protein"],
      allergies: ["Dairy", "Gluten", "Egg"],
      equipment: ["Grill"],

      ingredients: [
        { name: "Chicken", amount: 300, unit: "g" },
        { name: "Parmesan Cheese", amount: 60, unit: "g" },
        { name: "Olive Oil", amount: 1, unit: "tbsp" },
        { name: "Lemon", amount: 1, unit: "piece" },
        { name: "Black Pepper", amount: 0.5, unit: "tsp" },
        { name: "Salt", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Season the chicken with salt and pepper.",
        "Grill the chicken until fully cooked.",
        "Slice the chicken.",
        "Prepare the salad base.",
        "Top with chicken and parmesan.",
        "Finish with lemon juice and dressing.",
      ],

      nutrition: {
        calories: 390,
        protein: 42,
        fat: 20,
        carbs: 16,
        fiber: 3,
        sugar: 3,
        sodium: 610,
      },
    },

    // 12
    {
      title: "Chocolate Cake",
      slug: "classic-chocolate-cake",
      description:
        "Moist and rich chocolate cake perfect for dessert or celebrations.",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
      prepTime: 20,
      cookTime: 35,
      servings: 8,

      vegetarian: true,
      vegan: false,
      glutenFree: false,
      dairyFree: false,

      category: "Dessert",
      cuisine: "French",
      mealType: "Dessert",
      allergies: ["Gluten", "Dairy", "Egg"],
      equipment: ["Oven"],

      ingredients: [
        { name: "Flour", amount: 200, unit: "g" },
        { name: "Egg", amount: 3, unit: "pieces" },
        { name: "Butter", amount: 120, unit: "g" },
        { name: "Milk", amount: 150, unit: "ml" },
        { name: "Sugar", amount: 150, unit: "g" },
      ],

      instructions: [
        "Preheat the oven.",
        "Mix flour and sugar.",
        "Add eggs, milk, and melted butter.",
        "Mix until smooth.",
        "Pour into a baking pan.",
        "Bake until a toothpick comes out clean.",
        "Let the cake cool before serving.",
      ],

      nutrition: {
        calories: 420,
        protein: 6,
        fat: 22,
        carbs: 52,
        fiber: 2,
        sugar: 32,
        sodium: 280,
      },
    },

    // 13
    {
      title: "Hummus",
      slug: "classic-hummus",
      description:
        "Creamy Middle Eastern hummus made with chickpeas, tahini, lemon, and olive oil.",
      image: "https://images.unsplash.com/photo-1577805947697-89e18249d767",
      prepTime: 10,
      cookTime: 0,
      servings: 4,

      vegetarian: true,
      vegan: true,
      glutenFree: true,
      dairyFree: true,

      category: "Appetizer",
      cuisine: "Middle Eastern",
      mealType: "Appetizer",
      diets: ["Vegan", "Gluten Free"],
      allergies: ["Sesame"],
      equipment: ["Food Processor"],

      ingredients: [
        { name: "Chickpeas", amount: 400, unit: "g" },
        { name: "Tahini", amount: 60, unit: "g" },
        { name: "Lemon", amount: 1, unit: "piece" },
        { name: "Olive Oil", amount: 3, unit: "tbsp" },
        { name: "Garlic", amount: 1, unit: "clove" },
        { name: "Salt", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Drain and rinse the chickpeas.",
        "Add chickpeas, tahini, garlic, and lemon juice to a food processor.",
        "Blend until smooth.",
        "Add olive oil gradually.",
        "Season with salt.",
        "Blend again until creamy and serve.",
      ],

      nutrition: {
        calories: 280,
        protein: 10,
        fat: 17,
        carbs: 27,
        fiber: 7,
        sugar: 3,
        sodium: 330,
      },
    },

    // 14
    {
      title: "Vegetable Curry",
      slug: "vegetable-curry",
      description:
        "A fragrant vegetarian curry packed with colorful vegetables and warming spices.",
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
      prepTime: 15,
      cookTime: 30,
      servings: 4,

      vegetarian: true,
      vegan: true,
      glutenFree: true,
      dairyFree: true,

      category: "Main Course",
      cuisine: "Indian",
      mealType: "Dinner",
      diets: ["Vegan", "Gluten Free"],
      equipment: ["Pot"],

      ingredients: [
        { name: "Potato", amount: 300, unit: "g" },
        { name: "Carrot", amount: 200, unit: "g" },
        { name: "Tomato", amount: 250, unit: "g" },
        { name: "Onion", amount: 1, unit: "piece" },
        { name: "Garlic", amount: 2, unit: "cloves" },
        { name: "Olive Oil", amount: 2, unit: "tbsp" },
        { name: "Salt", amount: 1, unit: "tsp" },
      ],

      instructions: [
        "Chop all vegetables into small pieces.",
        "Heat oil in a pot.",
        "Cook onion and garlic.",
        "Add vegetables and tomatoes.",
        "Add curry spices and salt.",
        "Cover and simmer until vegetables are tender.",
        "Serve warm.",
      ],

      nutrition: {
        calories: 310,
        protein: 7,
        fat: 10,
        carbs: 48,
        fiber: 9,
        sugar: 9,
        sodium: 430,
      },
    },

    // 15
    {
      title: "Beef Burger",
      slug: "classic-beef-burger",
      description:
        "Juicy homemade beef burger served with fresh vegetables and a toasted bun.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
      prepTime: 15,
      cookTime: 15,
      servings: 2,

      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,

      category: "Main Course",
      cuisine: "American",
      mealType: "Dinner",
      diets: ["High Protein"],
      allergies: ["Gluten", "Dairy"],
      equipment: ["Grill"],

      ingredients: [
        { name: "Beef", amount: 300, unit: "g" },
        { name: "Onion", amount: 0.5, unit: "piece" },
        { name: "Tomato", amount: 1, unit: "piece" },
        { name: "Cheese", amount: 60, unit: "g", isOptional: true },
        { name: "Salt", amount: 1, unit: "tsp" },
        { name: "Black Pepper", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Season the beef with salt and black pepper.",
        "Shape the beef into burger patties.",
        "Grill the patties until cooked to your preference.",
        "Add cheese if desired.",
        "Toast the burger buns.",
        "Assemble with onion and tomato.",
      ],

      nutrition: {
        calories: 620,
        protein: 38,
        fat: 36,
        carbs: 40,
        fiber: 3,
        sugar: 7,
        sodium: 720,
      },
    },

    // 16
    {
      title: "Caprese Salad",
      slug: "caprese-salad",
      description:
        "Simple Italian salad with tomatoes, mozzarella, basil, and olive oil.",
      image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804",
      prepTime: 10,
      cookTime: 0,
      servings: 2,

      vegetarian: true,
      vegan: false,
      glutenFree: true,
      dairyFree: false,

      category: "Salad",
      cuisine: "Italian",
      mealType: "Lunch",
      allergies: ["Dairy"],
      equipment: [],

      ingredients: [
        { name: "Tomato", amount: 300, unit: "g" },
        { name: "Mozzarella Cheese", amount: 150, unit: "g" },
        { name: "Basil", amount: 10, unit: "leaves" },
        { name: "Olive Oil", amount: 2, unit: "tbsp" },
        { name: "Salt", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Slice the tomatoes and mozzarella.",
        "Arrange them on a plate.",
        "Add fresh basil leaves.",
        "Drizzle with olive oil.",
        "Season with salt and serve.",
      ],

      nutrition: {
        calories: 290,
        protein: 17,
        fat: 21,
        carbs: 10,
        fiber: 2,
        sugar: 5,
        sodium: 390,
      },
    },

    // 17
    {
      title: "French Omelette",
      slug: "french-omelette",
      description:
        "Soft and fluffy French-style omelette made with eggs and butter.",
      image: "https://images.unsplash.com/photo-1525351484163-7529414344d8",
      prepTime: 5,
      cookTime: 5,
      servings: 1,

      vegetarian: true,
      vegan: false,
      glutenFree: true,
      dairyFree: false,

      category: "Breakfast",
      cuisine: "French",
      mealType: "Breakfast",
      allergies: ["Egg", "Dairy"],
      equipment: ["Pan"],

      ingredients: [
        { name: "Egg", amount: 3, unit: "pieces" },
        { name: "Butter", amount: 15, unit: "g" },
        { name: "Salt", amount: 0.25, unit: "tsp" },
        { name: "Black Pepper", amount: 0.25, unit: "tsp" },
      ],

      instructions: [
        "Crack the eggs into a bowl and whisk.",
        "Season with salt and pepper.",
        "Melt butter in a non-stick pan.",
        "Pour in the eggs.",
        "Cook gently while folding the omelette.",
        "Serve immediately.",
      ],

      nutrition: {
        calories: 310,
        protein: 19,
        fat: 25,
        carbs: 2,
        fiber: 0,
        sugar: 1,
        sodium: 420,
      },
    },

    // 18
    {
      title: "Thai Coconut Soup",
      slug: "thai-coconut-soup",
      description:
        "A creamy Thai-inspired coconut soup with mushrooms, vegetables, and aromatic flavors.",
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd",
      prepTime: 15,
      cookTime: 25,
      servings: 4,

      vegetarian: true,
      vegan: true,
      glutenFree: true,
      dairyFree: true,

      category: "Soup",
      cuisine: "Thai",
      mealType: "Dinner",
      diets: ["Vegan", "Gluten Free"],
      allergies: [],
      equipment: ["Pot"],

      ingredients: [
        { name: "Mushroom", amount: 200, unit: "g" },
        { name: "Carrot", amount: 1, unit: "piece" },
        { name: "Onion", amount: 1, unit: "piece" },
        { name: "Garlic", amount: 2, unit: "cloves" },
        { name: "Coconut Milk", amount: 400, unit: "ml" },
        { name: "Lemon", amount: 1, unit: "piece" },
        { name: "Salt", amount: 0.5, unit: "tsp" },
      ],

      instructions: [
        "Slice the mushrooms and vegetables.",
        "Cook onion and garlic in a pot.",
        "Add mushrooms and carrots.",
        "Add coconut milk and simmer.",
        "Season with salt and lemon juice.",
        "Cook until the vegetables are tender.",
      ],

      nutrition: {
        calories: 260,
        protein: 6,
        fat: 18,
        carbs: 22,
        fiber: 5,
        sugar: 8,
        sodium: 390,
      },
    },

    // 19
    {
      title: "Roasted Garlic Potatoes",
      slug: "roasted-garlic-potatoes",
      description:
        "Crispy roasted potatoes seasoned with garlic, olive oil, and herbs.",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
      prepTime: 10,
      cookTime: 35,
      servings: 4,

      vegetarian: true,
      vegan: true,
      glutenFree: true,
      dairyFree: true,

      category: "Side Dish",
      cuisine: "Mediterranean",
      mealType: "Dinner",
      diets: ["Vegan", "Gluten Free"],
      equipment: ["Oven"],

      ingredients: [
        { name: "Potato", amount: 600, unit: "g" },
        { name: "Garlic", amount: 4, unit: "cloves" },
        { name: "Olive Oil", amount: 3, unit: "tbsp" },
        { name: "Salt", amount: 1, unit: "tsp" },
        { name: "Black Pepper", amount: 0.5, unit: "tsp" },
        { name: "Oregano", amount: 1, unit: "tsp" },
      ],

      instructions: [
        "Preheat the oven.",
        "Cut potatoes into small pieces.",
        "Toss potatoes with olive oil and seasonings.",
        "Add minced garlic.",
        "Spread potatoes on a baking tray.",
        "Roast until golden and crispy.",
      ],

      nutrition: {
        calories: 280,
        protein: 5,
        fat: 10,
        carbs: 44,
        fiber: 6,
        sugar: 3,
        sodium: 470,
      },
    },

    // 20
    {
      title: "Fresh Fruit Smoothie",
      slug: "fresh-fruit-smoothie",
      description:
        "A refreshing fruit smoothie made with banana, strawberries, and orange.",
      image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888",
      prepTime: 5,
      cookTime: 0,
      servings: 2,

      vegetarian: true,
      vegan: true,
      glutenFree: true,
      dairyFree: true,

      category: "Snack",
      cuisine: "American",
      mealType: "Snack",
      diets: ["Vegan", "Gluten Free"],
      equipment: ["Blender"],

      ingredients: [
        { name: "Banana", amount: 2, unit: "pieces" },
        { name: "Strawberry", amount: 150, unit: "g" },
        { name: "Orange", amount: 1, unit: "piece" },
        { name: "Lemon", amount: 0.5, unit: "piece" },
      ],

      instructions: [
        "Peel and slice the banana.",
        "Wash the strawberries and remove their stems.",
        "Peel the orange and separate it into segments.",
        "Add all fruit to a blender.",
        "Blend until smooth and creamy.",
        "Serve immediately.",
      ],

      nutrition: {
        calories: 210,
        protein: 3,
        fat: 1,
        carbs: 50,
        fiber: 7,
        sugar: 34,
        sodium: 5,
      },
    },
  ];

  // ------------------------------------------------
  // Seed all recipes
  // ------------------------------------------------

  for (const recipe of recipes) {
    await seedRecipe(recipe);
  }

  console.log("");
  console.log("🎉 Database seed completed successfully!");
  console.log(`🍽️ Seeded ${recipes.length} recipes.`);
}

// --------------------------------------------------
// Run
// --------------------------------------------------

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
