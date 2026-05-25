import { Router } from "express";
import { login, logout, me, signup } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, signupSchema } from "../validation/schemas.js";

const router = Router();

router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);

export default router;
