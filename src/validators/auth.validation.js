const Joi = require("joi");

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;

const registerSchema = Joi.object({
  name: Joi.string().min(2).trim().required().messages({
    "string.empty": "Name is required",
    "string.name":"at least 2 characters are required"
  }),
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email format",
    }),
  password: Joi.string()
    .pattern(new RegExp(passwordPattern))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "password must be 8-30 characters long,incude uppercase,lowercase,number & special character",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "string.empty": "Confirm password is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email format",
    }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

module.exports = { registerSchema, loginSchema };
