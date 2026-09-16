import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getMyFavorites = async (
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

    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        recipe: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      favorites,
    });
  } catch (error) {
    console.error("Get my favorites error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};