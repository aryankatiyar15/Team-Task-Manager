import { Router } from "express";
import { listUsers } from "../controllers/userController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, requireAdmin, listUsers);

export default router;
