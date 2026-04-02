const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/auth.controller");

const validate = require("../middlewares/validate.middleware");
const {
  registerSchema,
  loginSchema,
} = require("../validators/auth.validation");



router.post("/register", validate(registerSchema), registerUser);


router.post("/login", validate(loginSchema), loginUser);

module.exports = router;
