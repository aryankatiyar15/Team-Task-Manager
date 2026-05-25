import express from "express";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDistPath = path.join(__dirname, "../../client/dist");

app.use(express.static(clientDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

async function startServer() {
  try {
    await connectDB();

    app.listen(env.port, "0.0.0.0", () => {
      console.log(`Server running on 0.0.0.0:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();