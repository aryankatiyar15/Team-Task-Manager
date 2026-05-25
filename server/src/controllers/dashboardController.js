import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function emptyStatusCounts() {
  return {
    "To Do": 0,
    "In Progress": 0,
    Done: 0
  };
}

function summarizeTasks(tasks) {
  const tasksByStatus = emptyStatusCounts();

  for (const task of tasks) {
    tasksByStatus[task.status] += 1;
  }

  return {
    totalTasks: tasks.length,
    overdueTasks: tasks.filter((task) => task.isOverdue).length,
    tasksByStatus
  };
}

function progressForProject(project, tasks) {
  const projectTasks = tasks.filter((task) => {
    const projectId = task.project?._id || task.project;
    return projectId.toString() === project._id.toString();
  });

  const doneTasks = projectTasks.filter((task) => task.status === "Done").length;
  const totalTasks = projectTasks.length;

  return {
    _id: project._id,
    name: project.name,
    totalTasks,
    doneTasks,
    progress: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)
  };
}

function buildTasksPerUser(tasks) {
  const users = new Map();

  for (const task of tasks) {
    const user = task.assignee;
    const userId = user?._id?.toString();

    if (!userId) {
      continue;
    }

    if (!users.has(userId)) {
      users.set(userId, {
        _id: userId,
        name: user.name,
        email: user.email,
        totalTasks: 0,
        overdueTasks: 0,
        tasksByStatus: emptyStatusCounts()
      });
    }

    const row = users.get(userId);
    row.totalTasks += 1;
    row.tasksByStatus[task.status] += 1;

    if (task.isOverdue) {
      row.overdueTasks += 1;
    }
  }

  return [...users.values()].sort((a, b) => b.totalTasks - a.totalTasks);
}

export const getDashboard = asyncHandler(async (req, res) => {
  const projectFilter =
    req.user.role === "Admin"
      ? { owner: req.user._id }
      : { members: req.user._id };

  const projects = await Project.find(projectFilter)
    .populate("owner", "name email role")
    .populate("members", "name email role")
    .sort({ updatedAt: -1 });

  const projectIds = projects.map((project) => project._id);
  const taskFilter =
    req.user.role === "Admin"
      ? { project: { $in: projectIds } }
      : { assignee: req.user._id };

  const tasks = await Task.find(taskFilter)
    .populate("project", "name")
    .populate("assignee", "name email role")
    .sort({ dueDate: 1 });

  res.json({
    role: req.user.role,
    summary: summarizeTasks(tasks),
    tasksPerUser: buildTasksPerUser(tasks),
    projectProgress: projects.map((project) => progressForProject(project, tasks)),
    upcomingTasks: tasks.slice(0, 8)
  });
});
