import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import dotenv from "dotenv";

dotenv.config();

interface TokenPayload {
    userId: string;
    email: string;
}

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string | null;
                googlePhotoUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                message: "Access token required",
            });
            return;
        }

        // Verify the JWT token
        let decoded: TokenPayload;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

            console.log("Decoded JWT:", decoded);
        } catch (jwtError: any) {
            if (jwtError.name === "TokenExpiredError") {
                res.status(401).json({
                    message: "Token expired",
                });
            } else if (jwtError.name === "JsonWebTokenError") {
                res.status(401).json({
                    message: "Invalid token",
                });
            } else {
                res.status(401).json({
                    message: "Token verification failed",
                });
            }
            return;
        }

        // Get user details from database
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
            select: {
                id: true,
                email: true,
                name: true,
                googlePhotoUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            res.status(401).json({
                message: "User not found",
            });
            return;
        }
        console.log("Authenticated user:", user);

        // Attach user to request object
        req.user = user;

        // Continue to next middleware/route handler
        next();
    } catch (error: any) {
        console.error("Auth middleware error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Optional: Middleware for optional authentication (user might or might not be logged in)
export const optionalAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            // No token provided, continue without user
            next();
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

            const user = await prisma.user.findUnique({
                where: {
                    id: decoded.userId,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    googlePhotoUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (user) {
                req.user = user;
            }
        } catch (jwtError) {
            // Invalid token, but continue without user
            console.log("Optional auth - invalid token:", jwtError);
        }

        next();
    } catch (error: any) {
        console.error("Optional auth middleware error:", error);
        next(); // Continue even if there's an error
    }
};
