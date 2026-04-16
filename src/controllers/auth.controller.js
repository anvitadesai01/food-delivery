const User = require("../models/user.model");
const { generateToken } = require("../utlis/jwt");
const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

// REGISTER
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user);

    const isApi = req.originalUrl.startsWith("/api");

    if (isApi) {
      const userObj = user.toObject();
      delete userObj.password;

      return res.json(
        new ApiResponse(201, "User registered", {
          user: userObj,
          token,
        })
      );
    }

    // 🔥 WEB FLOW
    res.redirect("/login");
  } catch (err) {
    next(err);
  }
};
// LOGIN
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = generateToken(user);

    // 🔥 API vs WEB
    const isApi = req.originalUrl.startsWith("/api");

    if (isApi) {
      const userObj = user.toObject();
      delete userObj.password;

      return res.json(
        new ApiResponse(200, "Login successful", {
          user: userObj,
          token,
        })
      );
    }

    // 🔥 WEB FLOW
    res.redirect("/");
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser };
