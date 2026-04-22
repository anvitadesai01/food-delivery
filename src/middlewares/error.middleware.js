const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  console.error(err); // ✅ log full error (VERY IMPORTANT)

  // 🔥 Detect API or WEB
  const isApi = req.originalUrl.startsWith("/api");

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    if (isApi) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format",
      });
    }
    return res.status(400).render("pages/error", {
      title: "Error",
      message: "Invalid JSON format",
    });
  }

  // Invalid Mongo ID
  if (err instanceof mongoose.Error.CastError) {
    err = new ApiError(400, "Invalid ID format");
  }

  const statusCode = err.statusCode || 500;

  // 🔥 Hide internal errors in production style
  const message =
    statusCode === 500
      ? "Something went wrong."
      : err.message;

  // ================= API =================
  if (isApi) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // ================= WEB =================
  return res.status(statusCode).render("pages/error", {
    title: "Error",
    message,
    currentPath:req.path || ""
  });
};

module.exports = errorHandler;