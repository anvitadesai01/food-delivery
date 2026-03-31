const { register, login } = require("../services/auth.service");
const { generateToken } = require("../utlis/jwt");
const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

// REGISTER
const registerUser = async (req, res, next) => {
  try {
    const user = await register(req.body);

    return res.json(
      new ApiResponse(201, "User registered successfully", user)
    );
  } catch (err) {
    next(err); 
  }
};

// LOGIN
const loginUser = async (req, res, next) => {
  try {
    const user = await login(req.body);

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = generateToken(user);

    return res.json(
      new ApiResponse(200, "Login successful", { token })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser };