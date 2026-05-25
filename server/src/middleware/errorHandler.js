import { env } from "../config/env.js";

export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : "Something went wrong";
  let details = err.details;

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid id format";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate value already exists";
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired authentication token";
  }

  const response = {
    message
  };

  if (details) {
    response.details = details;
  }

  if (env.nodeEnv !== "production") {
    response.stack = err.stack;
    response.rawMessage = err.message;
  }

  res.status(statusCode).json(response);
}
