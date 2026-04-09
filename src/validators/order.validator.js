const Joi = require("joi");

const createOrderSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid("online", "cod")
    .lowercase()
    .required()
    .messages({
      "any.required": "Payment method is required",
      "any.only": "Invalid Payment method ,Payment method must be either 'online' or 'cod'",
      "string.base": "Payment method must be a string",
      "string.empty": "Payment method cannot be empty",
    }),
}).unknown(false)
  .messages({
    "object.unknown": "Invalid field provided",
  });;

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("preparing", "delivered")
    .required()
    .messages({
      "any.required": "Order status is required",
      "any.only": "Status must be either 'preparing' or 'delivered'",
      "string.base": "Status must be a string",
      "string.empty": "Status cannot be empty",
    }),
}).unknown(false)
  .messages({
    "object.unknown": "Invalid field provided",
  });



module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};