import { Router } from "express";
import {
  addMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeMember,
  updateProject
} from "../controllers/projectController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  memberSchema,
  projectCreateSchema,
  projectUpdateSchema
} from "../validation/schemas.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(listProjects)
  .post(requireAdmin, validateBody(projectCreateSchema), createProject);

router
  .route("/:projectId")
  .get(getProject)
  .patch(requireAdmin, validateBody(projectUpdateSchema), updateProject)
  .delete(requireAdmin, deleteProject);

router.post(
  "/:projectId/members",
  requireAdmin,
  validateBody(memberSchema),
  addMember
);

router.delete("/:projectId/members/:userId", requireAdmin, removeMember);

export default router;
