import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { projectAccess } from "./projectController.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const taskPopulate = [
  { path: "project", select: "name owner members" },
  { path: "assignee", select: "name email role" },
  { path: "createdBy", select: "name email role" }
];

async function populateTask(task) {
  return task.populate(taskPopulate);
}

async function getTaskOrThrow(taskId) {
  const task = await Task.findById(taskId).populate(taskPopulate);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
}

async function getProjectForAdmin(projectId, user) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  projectAccess.assertProjectOwner(project, user);
  return project;
}

async function assertAssignable(project, assigneeId) {
  const assignee = await User.findById(assigneeId).select("_id name email role");

  if (!assignee) {
    throw new AppError("Assignee not found", 404);
  }

  const ownerId = project.owner?._id || project.owner;
  const isOwner = ownerId.toString() === assignee._id.toString();
  const isMember = project.members.some((member) => {
    const memberId = member?._id || member;
    return memberId.toString() === assignee._id.toString();
  });

  if (!isOwner && !isMember) {
    throw new AppError("Assignee must be a project member", 400);
  }

  return assignee;
}

function isAssignedToUser(task, userId) {
  const assigneeId = task.assignee?._id || task.assignee;
  return assigneeId.toString() === userId.toString();
}

function assertTaskAccess(task, user) {
  if (user.role === "Admin" && projectAccess.ownsProject(task.project, user._id)) {
    return;
  }

  if (isAssignedToUser(task, user._id)) {
    return;
  }

  throw new AppError("You do not have access to this task", 403);
}

function assertAdminTaskAccess(task, user) {
  if (user.role === "Admin" && projectAccess.ownsProject(task.project, user._id)) {
    return;
  }

  throw new AppError("Only the project admin can manage this task", 403);
}

export const createTask = asyncHandler(async (req, res) => {
  const project = await getProjectForAdmin(req.body.projectId, req.user);
  await assertAssignable(project, req.body.assigneeId);

  const task = await Task.create({
    title: req.body.title,
    description: req.body.description,
    project: project._id,
    assignee: req.body.assigneeId,
    createdBy: req.user._id,
    dueDate: req.body.dueDate,
    priority: req.body.priority,
    status: req.body.status
  });

  await populateTask(task);
  res.status(201).json({ task });
});

export const listTasks = asyncHandler(async (req, res) => {
  const { projectId, status, priority } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (req.user.role === "Admin") {
    const projectFilter = { owner: req.user._id };

    if (projectId) {
      projectFilter._id = projectId;
    }

    const projectIds = await Project.find(projectFilter).distinct("_id");
    filter.project = { $in: projectIds };
  } else {
    filter.assignee = req.user._id;

    if (projectId) {
      filter.project = projectId;
    }
  }

  const tasks = await Task.find(filter)
    .populate(taskPopulate)
    .sort({ dueDate: 1, createdAt: -1 });

  res.json({ tasks });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await getTaskOrThrow(req.params.taskId);
  assertTaskAccess(task, req.user);

  res.json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await getTaskOrThrow(req.params.taskId);

  if (req.user.role !== "Admin") {
    if (!isAssignedToUser(task, req.user._id)) {
      throw new AppError("You can only update tasks assigned to you", 403);
    }

    const allowedKeys = ["status"];
    const invalidKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));

    if (invalidKeys.length > 0) {
      throw new AppError("Members can only update task status", 403);
    }

    if (req.body.status !== undefined) {
      task.status = req.body.status;
    }
  } else {
    assertAdminTaskAccess(task, req.user);

    if (req.body.assigneeId) {
      const project = await Project.findById(task.project._id || task.project);
      await assertAssignable(project, req.body.assigneeId);
      task.assignee = req.body.assigneeId;
    }

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.status !== undefined) task.status = req.body.status;
  }

  await task.save();
  await populateTask(task);

  res.json({ task });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await getTaskOrThrow(req.params.taskId);
  assertTaskAccess(task, req.user);

  task.status = req.body.status;
  await task.save();
  await populateTask(task);

  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await getTaskOrThrow(req.params.taskId);
  assertAdminTaskAccess(task, req.user);

  await task.deleteOne();
  res.json({ message: "Task deleted" });
});
