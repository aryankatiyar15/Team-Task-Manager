import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const projectPopulate = [
  { path: "owner", select: "name email role" },
  { path: "members", select: "name email role" }
];

function uniqueIds(ids = []) {
  return [...new Set(ids.map((id) => id.toString()))];
}

function ownsProject(project, userId) {
  const ownerId = project.owner?._id || project.owner;
  return ownerId?.toString() === userId.toString();
}

function isProjectMember(project, userId) {
  return project.members.some((member) => {
    const memberId = member?._id || member;
    return memberId.toString() === userId.toString();
  });
}

async function getProjectOrThrow(projectId) {
  const project = await Project.findById(projectId).populate(projectPopulate);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
}

function assertProjectAccess(project, user) {
  if (ownsProject(project, user._id) || isProjectMember(project, user._id)) {
    return;
  }

  throw new AppError("You do not have access to this project", 403);
}

function assertProjectOwner(project, user) {
  if (user.role === "Admin" && ownsProject(project, user._id)) {
    return;
  }

  throw new AppError("Only the project admin can perform this action", 403);
}

async function validateMembers(memberIds) {
  const uniqueMemberIds = uniqueIds(memberIds);

  if (uniqueMemberIds.length === 0) {
    return [];
  }

  const users = await User.find({ _id: { $in: uniqueMemberIds } }).select("_id");

  if (users.length !== uniqueMemberIds.length) {
    throw new AppError("One or more members were not found", 400);
  }

  return uniqueMemberIds;
}

export const createProject = asyncHandler(async (req, res) => {
  const memberIds = await validateMembers(req.body.memberIds);
  const project = await Project.create({
    name: req.body.name,
    description: req.body.description,
    owner: req.user._id,
    members: memberIds
  });

  const populatedProject = await project.populate(projectPopulate);
  res.status(201).json({ project: populatedProject });
});

export const listProjects = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "Admin"
      ? { owner: req.user._id }
      : { members: req.user._id };

  const projects = await Project.find(filter)
    .populate(projectPopulate)
    .sort({ updatedAt: -1 });

  res.json({ projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectOrThrow(req.params.projectId);
  assertProjectAccess(project, req.user);

  const taskFilter =
    req.user.role === "Admin" && ownsProject(project, req.user._id)
      ? { project: project._id }
      : { project: project._id, assignee: req.user._id };

  const tasks = await Task.find(taskFilter)
    .populate("assignee", "name email role")
    .populate("createdBy", "name email role")
    .sort({ dueDate: 1 });

  res.json({ project, tasks });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await getProjectOrThrow(req.params.projectId);
  assertProjectOwner(project, req.user);

  if (req.body.name !== undefined) {
    project.name = req.body.name;
  }

  if (req.body.description !== undefined) {
    project.description = req.body.description;
  }

  await project.save();
  await project.populate(projectPopulate);

  res.json({ project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await getProjectOrThrow(req.params.projectId);
  assertProjectOwner(project, req.user);

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ message: "Project and related tasks deleted" });
});

export const addMember = asyncHandler(async (req, res) => {
  const project = await getProjectOrThrow(req.params.projectId);
  assertProjectOwner(project, req.user);

  const member = await User.findById(req.body.userId).select("_id name email role");

  if (!member) {
    throw new AppError("User not found", 404);
  }

  const ownerId = project.owner?._id || project.owner;

  if (ownerId.toString() === member._id.toString()) {
    throw new AppError("Project owner is already the admin for this project", 400);
  }

  if (!isProjectMember(project, member._id)) {
    project.members.push(member._id);
    await project.save();
  }

  await project.populate(projectPopulate);
  res.json({ project });
});

export const removeMember = asyncHandler(async (req, res) => {
  const project = await getProjectOrThrow(req.params.projectId);
  assertProjectOwner(project, req.user);

  const openTasks = await Task.countDocuments({
    project: project._id,
    assignee: req.params.userId,
    status: { $ne: "Done" }
  });

  if (openTasks > 0) {
    throw new AppError("Complete or reassign this member's open tasks before removing them", 400);
  }

  project.members = project.members.filter((member) => {
    const memberId = member?._id || member;
    return memberId.toString() !== req.params.userId;
  });

  await project.save();
  await project.populate(projectPopulate);

  res.json({ project });
});

export const projectAccess = {
  ownsProject,
  isProjectMember,
  assertProjectOwner,
  assertProjectAccess
};
