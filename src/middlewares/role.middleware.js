const ApiError = require('../utlis/ApiError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied'));
    }
    next();
  };
};

const authorizePage = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect("/login");
    }

    if (!roles.includes(req.user.role)) {
      return res.redirect("/");
    }

    next();
  };
};

module.exports = authorize;
module.exports.authorizePage = authorizePage;
