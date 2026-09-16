import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.session;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const session = await prisma.session.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: {
          id: session.id,
        },
      });

      res.clearCookie("session");

      return res.status(401).json({
        message: "Session expired",
      });
    }

    req.user = session.user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};