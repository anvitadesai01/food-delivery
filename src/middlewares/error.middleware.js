const mongoose = require("mongoose");
const ApiError = require("../utlis/ApiError");

const errorHandler = (err, req, res, next) => {
  console.error(err); // keep for debugging

  if (err instanceof mongoose.Error.CastError) {
    err = new ApiError(400, "Invalid ID format");
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;