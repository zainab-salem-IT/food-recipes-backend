import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
  openapi: "3.0.0",

  info: {
    title: "Savorly API",
    version: "1.0.0",
    description: "API for the Savorly food recipes application",
  },

  servers: [
    {
      url: "http://localhost:5000",
    },
  ],

  tags: [
    {
      name: "Authentication",
      description: "User registration, login and session management",
    },
    {
      name: "Recipes",
      description: "Recipe management and discovery",
    },
    {
      name: "Favorites",
      description: "Manage user's favorite recipes",
    },
    {
      name: "Shopping List",
      description: "Manage user's personal shopping list",
    },
  ],

  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description:
          "Authentication session cookie created after successful login.",
      },
    },

    schemas: {
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "cmtocu84o0000u4txt9jl7vez",
          },
          name: {
            type: "string",
            example: "Zainab",
          },
          email: {
            type: "string",
            format: "email",
            example: "zainab@example.com",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      Ingredient: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "cmtoni12p001ey8txrtslvbng",
          },
          name: {
            type: "string",
            example: "Chicken",
          },
          normalizedName: {
            type: "string",
            example: "chicken",
          },
        },
      },

      ShoppingListItem: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "cmtshoppingitem123",
          },
          ingredientId: {
            type: "string",
            example: "cmtoni12p001ey8txrtslvbng",
          },
          amount: {
            type: "number",
            nullable: true,
            example: 500,
          },
          unit: {
            type: "string",
            nullable: true,
            example: "g",
          },
          isChecked: {
            type: "boolean",
            example: false,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
    },
  },

  paths: {
    // =========================
    // Authentication
    // =========================

    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: {
                    type: "string",
                    example: "Zainab",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "zainab@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "Password123!",
                  },
                },
              },
            },
          },
        },

        responses: {
          "201": {
            description: "User registered successfully",
          },
          "400": {
            description: "Name, email or password is missing",
          },
          "409": {
            description: "Email is already registered",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        description: "Authenticates the user and creates a session cookie.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "zainab@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "Password123!",
                  },
                },
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Login successful",
          },
          "400": {
            description: "Email or password is missing",
          },
          "401": {
            description: "Invalid email or password",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user",
        security: [
          {
            sessionCookie: [],
          },
        ],

        responses: {
          "200": {
            description: "Current user retrieved successfully",
          },
          "401": {
            description: "Authentication required or session invalid",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout current user",
        security: [
          {
            sessionCookie: [],
          },
        ],

        responses: {
          "200": {
            description: "Logout successful",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    // =========================
    // Recipes
    // =========================

    "/api/recipes": {
      get: {
        tags: ["Recipes"],
        summary: "Get recipes",
        description:
          "Get recipes with optional search, filters, and pagination.",

        parameters: [
          {
            name: "query",
            in: "query",
            schema: {
              type: "string",
            },
            description: "Search recipes by title",
          },
          {
            name: "cuisine",
            in: "query",
            schema: {
              type: "string",
            },
            example: "Italian",
          },
          {
            name: "diet",
            in: "query",
            schema: {
              type: "string",
            },
            example: "Vegan",
          },
          {
            name: "intolerances",
            in: "query",
            schema: {
              type: "string",
            },
            description:
              "Exclude recipes containing specific allergens. Use comma-separated values.",
            example: "Dairy,Gluten",
          },
          {
            name: "includeIngredients",
            in: "query",
            schema: {
              type: "string",
            },
            description:
              "Include recipes containing specific ingredients. Use comma-separated values.",
            example: "Chicken,Garlic",
          },
          {
            name: "excludeIngredients",
            in: "query",
            schema: {
              type: "string",
            },
            example: "Peanut",
          },
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
            },
            description: "Filter by meal type",
            example: "Dinner",
          },
          {
            name: "page",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              default: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 10,
            },
          },
          {
            name: "sortBy",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["createdAt", "title", "totalTime"],
              default: "createdAt",
            },
            description: "Sort recipes by a specific field",
          },

          {
            name: "order",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
            description: "Sort order",
          },
        ],

        responses: {
          "200": {
            description: "Recipes retrieved successfully",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },

      post: {
        tags: ["Recipes"],
        summary: "Create a recipe",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "slug", "ingredients", "instructions"],
                properties: {
                  title: {
                    type: "string",
                    example: "Tomato Pasta",
                  },
                  slug: {
                    type: "string",
                    example: "tomato-pasta",
                  },
                  description: {
                    type: "string",
                    example: "A simple and delicious tomato pasta.",
                  },
                  image: {
                    type: "string",
                    example: "https://example.com/pasta.jpg",
                  },
                  prepTime: {
                    type: "integer",
                    example: 10,
                  },
                  cookTime: {
                    type: "integer",
                    example: 20,
                  },
                  totalTime: {
                    type: "integer",
                    example: 30,
                  },
                  servings: {
                    type: "integer",
                    example: 4,
                  },
                  vegetarian: {
                    type: "boolean",
                    example: true,
                  },
                  vegan: {
                    type: "boolean",
                    example: true,
                  },
                  glutenFree: {
                    type: "boolean",
                    example: false,
                  },
                  dairyFree: {
                    type: "boolean",
                    example: true,
                  },
                  containsAlcohol: {
                    type: "boolean",
                    example: false,
                  },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["ingredientId"],
                      properties: {
                        ingredientId: {
                          type: "string",
                        },
                        amount: {
                          type: "number",
                          example: 200,
                        },
                        unit: {
                          type: "string",
                          example: "g",
                        },
                        preparation: {
                          type: "string",
                          nullable: true,
                          example: "chopped",
                        },
                        isOptional: {
                          type: "boolean",
                          example: false,
                        },
                      },
                    },
                  },
                  categories: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Pasta"],
                  },
                  cuisines: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Italian"],
                  },
                  diets: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Vegan"],
                  },
                  allergies: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Gluten"],
                  },
                  mealTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Dinner"],
                  },
                  equipment: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Pot"],
                  },
                  instructions: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["step", "text"],
                      properties: {
                        step: {
                          type: "integer",
                          example: 1,
                        },
                        text: {
                          type: "string",
                          example: "Cook the pasta until al dente.",
                        },
                        section: {
                          type: "string",
                          nullable: true,
                        },
                      },
                    },
                  },
                  nutrition: {
                    type: "object",
                    nullable: true,
                    properties: {
                      calories: {
                        type: "number",
                      },
                      protein: {
                        type: "number",
                      },
                      fat: {
                        type: "number",
                      },
                      carbs: {
                        type: "number",
                      },
                      fiber: {
                        type: "number",
                      },
                      sugar: {
                        type: "number",
                      },
                      sodium: {
                        type: "number",
                      },
                    },
                  },
                },
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Recipe created successfully",
          },
          "400": {
            description: "Invalid recipe data",
          },
          "409": {
            description: "Recipe slug already exists",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/recipes/random": {
      get: {
        tags: ["Recipes"],
        summary: "Get random recipes",

        parameters: [
          {
            name: "number",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 10,
              default: 1,
            },
          },
        ],

        responses: {
          "200": {
            description: "Random recipes retrieved successfully",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/recipes/autocomplete": {
      get: {
        tags: ["Recipes"],
        summary: "Autocomplete recipe search",

        parameters: [
          {
            name: "query",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            example: "pasta",
          },
        ],

        responses: {
          "200": {
            description: "Autocomplete results retrieved successfully",
          },
          "400": {
            description: "Query is required",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/recipes/{id}": {
      get: {
        tags: ["Recipes"],
        summary: "Get recipe by ID",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "200": {
            description: "Recipe retrieved successfully",
          },
          "404": {
            description: "Recipe not found",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },

      patch: {
        tags: ["Recipes"],
        summary: "Update a recipe",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  slug: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                  },
                  prepTime: {
                    type: "integer",
                  },
                  cookTime: {
                    type: "integer",
                  },
                  totalTime: {
                    type: "integer",
                  },
                  servings: {
                    type: "integer",
                  },
                  vegetarian: {
                    type: "boolean",
                  },
                  vegan: {
                    type: "boolean",
                  },
                  glutenFree: {
                    type: "boolean",
                  },
                  dairyFree: {
                    type: "boolean",
                  },
                  containsAlcohol: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Recipe updated successfully",
          },
          "404": {
            description: "Recipe not found",
          },
          "409": {
            description: "Recipe slug already exists",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },

      delete: {
        tags: ["Recipes"],
        summary: "Delete a recipe",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "200": {
            description: "Recipe deleted successfully",
          },
          "404": {
            description: "Recipe not found",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/recipes/{id}/ingredients": {
      get: {
        tags: ["Recipes"],
        summary: "Get recipe ingredients",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "200": {
            description: "Recipe ingredients retrieved successfully",
          },
          "404": {
            description: "Recipe not found",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/recipes/{id}/instructions": {
      get: {
        tags: ["Recipes"],
        summary: "Get recipe instructions",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "200": {
            description: "Recipe instructions retrieved successfully",
          },
          "404": {
            description: "Recipe not found",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/recipes/{id}/similar": {
      get: {
        tags: ["Recipes"],
        summary: "Get similar recipes",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "200": {
            description: "Similar recipes retrieved successfully",
          },
          "404": {
            description: "Recipe not found",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    // =========================
    // Favorites
    // =========================

    "/api/recipes/{id}/favorite": {
      post: {
        tags: ["Favorites"],
        summary: "Add recipe to favorites",

        security: [
          {
            sessionCookie: [],
          },
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "201": {
            description: "Recipe added to favorites",
          },
          "401": {
            description: "Authentication required",
          },
          "404": {
            description: "Recipe not found",
          },
          "409": {
            description: "Recipe is already in favorites",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },

      delete: {
        tags: ["Favorites"],
        summary: "Remove recipe from favorites",

        security: [
          {
            sessionCookie: [],
          },
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "200": {
            description: "Recipe removed from favorites",
          },
          "401": {
            description: "Authentication required",
          },
          "404": {
            description: "Recipe is not in favorites",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/users/me/favorites": {
      get: {
        tags: ["Favorites"],
        summary: "Get current user's favorite recipes",

        security: [
          {
            sessionCookie: [],
          },
        ],

        responses: {
          "200": {
            description: "Favorites retrieved successfully",
          },
          "401": {
            description: "Authentication required",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    // =========================
    // Shopping List
    // =========================

    "/api/shopping-list": {
      get: {
        tags: ["Shopping List"],
        summary: "Get shopping list",

        security: [
          {
            sessionCookie: [],
          },
        ],

        responses: {
          "200": {
            description: "Shopping list retrieved successfully",
          },
          "401": {
            description: "Authentication required",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },

      post: {
        tags: ["Shopping List"],
        summary: "Add ingredient to shopping list",

        security: [
          {
            sessionCookie: [],
          },
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ingredientId"],
                properties: {
                  ingredientId: {
                    type: "string",
                    example: "cmtoni12p001ey8txrtslvbng",
                  },
                  amount: {
                    type: "number",
                    nullable: true,
                    example: 500,
                  },
                  unit: {
                    type: "string",
                    nullable: true,
                    example: "g",
                  },
                },
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Ingredient added to shopping list",
          },
          "400": {
            description: "Ingredient id is required",
          },
          "401": {
            description: "Authentication required",
          },
          "404": {
            description: "Ingredient not found",
          },
          "409": {
            description: "Ingredient is already in shopping list",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },

      delete: {
        tags: ["Shopping List"],
        summary: "Clear shopping list",

        security: [
          {
            sessionCookie: [],
          },
        ],

        responses: {
          "200": {
            description: "Shopping list cleared",
          },
          "401": {
            description: "Authentication required",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/shopping-list/{id}": {
      patch: {
        tags: ["Shopping List"],
        summary: "Update shopping list item",

        security: [
          {
            sessionCookie: [],
          },
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  isChecked: {
                    type: "boolean",
                    example: true,
                  },
                  amount: {
                    type: "number",
                    nullable: true,
                    example: 700,
                  },
                  unit: {
                    type: "string",
                    nullable: true,
                    example: "g",
                  },
                },
              },
              example: {
                isChecked: true,
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Shopping list item updated",
          },
          "400": {
            description: "Invalid update data",
          },
          "401": {
            description: "Authentication required",
          },
          "404": {
            description: "Shopping list item not found",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },

      delete: {
        tags: ["Shopping List"],
        summary: "Delete shopping list item",

        security: [
          {
            sessionCookie: [],
          },
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "200": {
            description: "Shopping list item deleted",
          },
          "401": {
            description: "Authentication required",
          },
          "404": {
            description: "Shopping list item not found",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },

    "/api/recipes/{id}/shopping-list": {
      post: {
        tags: ["Shopping List"],
        summary: "Add recipe ingredients to shopping list",

        security: [
          {
            sessionCookie: [],
          },
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          "201": {
            description: "Recipe ingredients added to shopping list",
          },
          "400": {
            description: "Recipe has no ingredients",
          },
          "401": {
            description: "Authentication required",
          },
          "404": {
            description: "Recipe not found",
          },
          "409": {
            description: "All recipe ingredients are already in shopping list",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },
  },
};

export { swaggerUi, swaggerDocument };
