import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ name: 1 })
    .limit(100);

  res.json({ users });
});
