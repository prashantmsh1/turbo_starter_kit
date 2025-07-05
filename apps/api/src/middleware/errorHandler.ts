import { Request, Response, NextFunction } from "express";

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", error);

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
};
