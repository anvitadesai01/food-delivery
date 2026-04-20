const User = require("../models/user.model");
const { generateToken } = require("../utlis/jwt");
const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};

const buildRedirectPath = (user) =>
  user.role === "admin" ? "/admin/dashboard" : "/";

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
    const userObj = sanitizeUser(user);
    const redirectTo = buildRedirectPath(userObj);
    res.cookie("token", token, AUTH_COOKIE_OPTIONS);

    const isApi = req.originalUrl.startsWith("/api");

    if (isApi) {
      return res.json(
        new ApiResponse(201, "User registered", {
          user: userObj,
          token,
          redirectTo,
        })
      );
    }

    res.redirect(redirectTo);
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
    const userObj = sanitizeUser(user);
    const redirectTo = buildRedirectPath(userObj);
    res.cookie("token", token, AUTH_COOKIE_OPTIONS);

    const isApi = req.originalUrl.startsWith("/api");

    if (isApi) {
      return res.json(
        new ApiResponse(200, "Login successful", {
          user: userObj,
          token,
          redirectTo,
        })
      );
    }

    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
};

const getCurrentUser = async (req, res) => {
  return res.json(
    new ApiResponse(200, "Current user fetched", {
      user: req.user,
      redirectTo: buildRedirectPath(req.user),
    })
  );
};

const logoutUser = async (req, res) => {
  res.clearCookie("token");

  return res.json(new ApiResponse(200, "Logout successful"));
};

module.exports = { registerUser, loginUser, getCurrentUser, logoutUser };
