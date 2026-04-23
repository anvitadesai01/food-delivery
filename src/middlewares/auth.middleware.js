const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");


const protectJWT = passport.authenticate("jwt", { session: false });


const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.split("=");
      acc[key] = decodeURIComponent(valueParts.join("="));
      return acc;
    }, {});

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookies = parseCookies(req.headers.cookie);
  return cookies.token || null;
};

const attachUser = async (req, token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.id).select("-password");

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  req.user = user;
  return user;
};



//  CUSTOM AUTH 
const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    await attachUser(req, token);
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Unauthorized"));
  }
};

const protectPage = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.redirect("/login");
    }

    await attachUser(req, token);
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      await attachUser(req, token);
    }
  } catch (error) {
    req.user = null;
  }

  next();
};



module.exports = {
  protect,          // custom JWT (API + SSR)
  protectPage,      // SSR redirect
  optionalAuth,     // optional login
  getTokenFromRequest,
  protectJWT        // ✅ passport version (for Postman/testing)
};