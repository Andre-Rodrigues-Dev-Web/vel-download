const { ZodError } = require("zod");
const { AppError } = require("../utils/errors");
const logger = require("../utils/logger");

function errorHandler(error, req, res, next) {
  let statusCode = 500;
  let message = "Erro interno do servidor";
  let details = null;

  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Falha de validação";
    details = error.issues;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  logger.error("Request error", {
    statusCode,
    message,
    details,
    route: req.originalUrl,
    method: req.method,
    stack: error.stack
  });

  res.status(statusCode).json({
    success: false,
    message,
    details
  });
}

module.exports = {
  errorHandler
};
