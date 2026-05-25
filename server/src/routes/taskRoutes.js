import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
  updateTaskStatus
} from "../controllers/taskController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  taskCreateSchema,
  taskStatusSchema,
  taskUpdateSchema
} from "../validation/schemas.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(listTasks)
  .post(requireAdmin, validateBody(taskCreateSchema), createTask);

router
  .route("/:taskId")
  .get(getTask)
  .patch(validateBody(taskUpdateSchema), updateTask)
  .delete(requireAdmin, deleteTask);

router.patch("/:taskId/status", validateBody(taskStatusSchema), updateTaskStatus);

export default router;
