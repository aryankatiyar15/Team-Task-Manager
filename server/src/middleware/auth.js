import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Authentication token is required", 401);
  }

  const token = authHeader.split(" ")[1];
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(payload.id).select("-passwordHash");

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  req.user = user;
  return next();
});

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "Admin") {
    return next(new AppError("Admin access required", 403));
  }

  return next();
}
