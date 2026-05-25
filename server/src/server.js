import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

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
