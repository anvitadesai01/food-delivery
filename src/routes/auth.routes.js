const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} = require("../controllers/auth.controller");

const validate = require("../middlewares/validate.middleware");
const protect = require("../middlewares/auth.middleware");
const {
  registerSchema,
  loginSchema,
} = require("../validators/auth.validator");



router.post("/register", validate(registerSchema), registerUser);


router.post("/login", validate(loginSchema), loginUser);
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logoutUser);

module.exports = router;
