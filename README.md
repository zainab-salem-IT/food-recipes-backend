# Savorly Backend

Backend API for **Savorly**, a full-stack recipe application.

Savorly provides a REST API for authentication, recipes, ingredients, favorites, shopping lists, recipe search, and more.

## Tech Stack

* Node.js
* Express 5
* TypeScript
* PostgreSQL
* Prisma ORM
* Neon PostgreSQL
* bcrypt
* Cookie-based authentication
* Swagger UI

## Features

* User registration and login
* Session-based authentication using HTTP-only cookies
* Get current authenticated user
* User logout
* Create, update, and delete recipes
* Recipe search and filtering
* Recipe categories
* Ingredients
* Cuisines
* Diets
* Allergies
* Meal types
* Equipment
* Favorites
* Shopping lists
* Recipe instructions
* Nutrition information
* Similar recipes
* Autocomplete
* Swagger API documentation

## Requirements

Before running the project, make sure you have:

* Node.js
* pnpm
* PostgreSQL database

You can use a local PostgreSQL database or a hosted PostgreSQL provider such as Neon.

## Installation

Clone the repository:

git clone <YOUR_GITHUB_REPOSITORY_URL>

Go into the project:

cd savorly-back


Install dependencies:

pnpm install

## Environment Variables

Create a `.env` file in the project root:

DATABASE_URL="your_postgresql_connection_string"


Example:


DATABASE_URL="postgresql://username:password@host/database"

> Do not commit your `.env` file to GitHub.

Make sure `.gitignore` contains:

```gitignore
.env
node_modules
```

## Database Setup

Generate the Prisma Client:

pnpm prisma generate

Apply the existing database migrations:

pnpm prisma migrate deploy


Seed the database with sample recipes and related data:

pnpm db:seed


The seed creates sample data including:

* Recipes
* Ingredients
* Categories
* Cuisines
* Diets
* Allergies
* Meal types
* Equipment
* Instructions
* Nutrition information

## Running the Project

Start the development server:

pnpm dev

The API will run on:

http://localhost:5000


## Available Scripts

| Command                      | Description                  |
| ---------------------------- | ---------------------------- |
| `pnpm dev`                   | Start the development server |
| `pnpm build`                 | Build the TypeScript project |
| `pnpm start`                 | Start the production build   |
| `pnpm prisma generate`       | Generate Prisma Client       |
| `pnpm prisma migrate deploy` | Apply existing migrations    |
| `pnpm db:seed`               | Seed the database            |

## API Documentation

Swagger documentation is available at:

http://localhost:5000/api-docs


After starting the server, open the URL in your browser to explore and test the API endpoints.

## API Endpoints

### Authentication

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login                |
| GET    | `/api/auth/me`       | Get the current user |
| POST   | `/api/auth/logout`   | Logout               |

### Recipes

| Method | Endpoint                        | Description             |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/api/recipes`                  | Search and get recipes  |
| GET    | `/api/recipes/random`           | Get random recipes      |
| GET    | `/api/recipes/:id`              | Get a recipe            |
| POST   | `/api/recipes`                  | Create a recipe         |
| PATCH  | `/api/recipes/:id`              | Update a recipe         |
| DELETE | `/api/recipes/:id`              | Delete a recipe         |
| GET    | `/api/recipes/autocomplete`     | Recipe autocomplete     |
| GET    | `/api/recipes/:id/ingredients`  | Get recipe ingredients  |
| GET    | `/api/recipes/:id/instructions` | Get recipe instructions |
| GET    | `/api/recipes/:id/similar`      | Get similar recipes     |

### Favorites

| Method | Endpoint                    | Description                  |
| ------ | --------------------------- | ---------------------------- |
| GET    | `/api/users/me/favorites`   | Get user's favorites         |
| POST   | `/api/recipes/:id/favorite` | Add recipe to favorites      |
| DELETE | `/api/recipes/:id/favorite` | Remove recipe from favorites |

### Shopping List

| Method | Endpoint                 | Description         |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/shopping-list`     | Get shopping list   |
| POST   | `/api/shopping-list`     | Add item            |
| PATCH  | `/api/shopping-list/:id` | Update item         |
| DELETE | `/api/shopping-list/:id` | Delete item         |
| DELETE | `/api/shopping-list`     | Clear shopping list |

## Database Structure

The application uses PostgreSQL with Prisma ORM.

Main models include:

* `User`
* `Session`
* `Recipe`
* `Ingredient`
* `RecipeIngredient`
* `Category`
* `RecipeCategory`
* `Cuisine`
* `RecipeCuisine`
* `Diet`
* `RecipeDiet`
* `Allergy`
* `RecipeAllergy`
* `MealType`
* `RecipeMealType`
* `Equipment`
* `RecipeEquipment`
* `Instruction`
* `Nutrition`
* `Favorite`
* `ShoppingListItem`

## Authentication

Savorly uses session-based authentication.

After login, the server creates a session and sends it using an HTTP-only cookie.

Protected endpoints require the user's authenticated session.

## Project Structure


savorly-back/
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── generated/
│   └── server.ts
│
├── .env
├── .gitignore
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── README.md

## Development Workflow

After cloning the project:

pnpm install

Create your `.env` file and add your PostgreSQL connection string.

Then:

pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
pnpm dev


The backend should now be available at:


http://localhost:5000


Swagger API documentation:

http://localhost:5000/api-docs


## License

This project is currently intended for educational and portfolio purposes.
