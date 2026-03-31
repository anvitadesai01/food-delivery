const User = require("../models/user.model");
const { generateToken } = require("../utlis/jwt");
const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

// REGISTER
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    // create user
    const user = await User.create({ name, email, password });

    // remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    return res.json(
      new ApiResponse(201, "User registered successfully", userObj)
    );
  } catch (err) {
    next(err);
  }
};

// LOGIN
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    // generate token
    const token = generateToken(user);

    return res.json(
      new ApiResponse(200, "Login successful", { token })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser };