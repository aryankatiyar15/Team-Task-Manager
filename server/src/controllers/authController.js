import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/jwt.js";

function buildAuthResponse(user) {
  return {
    token: signToken(user),
    user: user.toJSON()
  };
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role = "Member" } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });

  res.status(201).json(buildAuthResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  res.json(buildAuthResponse(user));
});

export function logout(_req, res) {
  res.json({ message: "Logged out successfully" });
}

export function me(req, res) {
  res.json({ user: req.user });
}
