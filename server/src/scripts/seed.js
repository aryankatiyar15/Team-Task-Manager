import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

const demoUsers = [
  {
    name: "Asha Admin",
    email: "admin@example.com",
    password: "Admin@12345",
    role: "Admin"
  },
  {
    name: "Meera Member",
    email: "meera@example.com",
    password: "Member@12345",
    role: "Member"
  },
  {
    name: "Rahul Member",
    email: "rahul@example.com",
    password: "Member@12345",
    role: "Member"
  }
];

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed() {
  await connectDB();

  const emails = demoUsers.map((user) => user.email);
  const existingUsers = await User.find({ email: { $in: emails } }).select("_id");
  const userIds = existingUsers.map((user) => user._id);
  const existingProjects = await Project.find({
    $or: [{ owner: { $in: userIds } }, { members: { $in: userIds } }]
  }).select("_id");
  const projectIds = existingProjects.map((project) => project._id);

  await Task.deleteMany({
    $or: [
      { project: { $in: projectIds } },
      { assignee: { $in: userIds } },
      { createdBy: { $in: userIds } }
    ]
  });
  await Project.deleteMany({ _id: { $in: projectIds } });
  await User.deleteMany({ _id: { $in: userIds } });

  const [admin, meera, rahul] = await Promise.all(
    demoUsers.map(async (user) =>
      User.create({
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: await bcrypt.hash(user.password, 12)
      })
    )
  );

  const project = await Project.create({
    name: "College Fest Website",
    description: "Plan, design, and deliver the event website before assessment day.",
    owner: admin._id,
    members: [meera._id, rahul._id]
  });

  await Task.insertMany([
    {
      title: "Design homepage wireframe",
      description: "Create a clean layout with event highlights and registration CTA.",
      project: project._id,
      assignee: meera._id,
      createdBy: admin._id,
      dueDate: daysFromNow(3),
      priority: "High",
      status: "In Progress"
    },
    {
      title: "Build registration API",
      description: "Create the endpoint and validation for student registrations.",
      project: project._id,
      assignee: rahul._id,
      createdBy: admin._id,
      dueDate: daysFromNow(5),
      priority: "Medium",
      status: "To Do"
    },
    {
      title: "Finalize content checklist",
      description: "Confirm schedule, venue details, and sponsor copy.",
      project: project._id,
      assignee: meera._id,
      createdBy: admin._id,
      dueDate: daysFromNow(-1),
      priority: "Low",
      status: "To Do"
    }
  ]);

  console.log("Demo data created");
  console.log("Admin: admin@example.com / Admin@12345");
  console.log("Member: meera@example.com / Member@12345");
  console.log("Member: rahul@example.com / Member@12345");

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
