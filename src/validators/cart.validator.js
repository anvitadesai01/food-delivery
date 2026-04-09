const Joi = require("joi");
const objectId = require("../utlis/objectId.validator");

/**
 * ADD TO CART
 */
const addToCartSchema = Joi.object({
  menuItemId: Joi.string()
    .required()
    .custom(objectId)
    .messages({
      "string.base": "Menu item ID must be a string",
      "any.required": "Menu item ID is required",
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1",
      "any.required": "Quantity is required",
    }),
}).unknown(false)
  .messages({
    "object.unknown": "Invalid field provided",
  });;

/**
 * UPDATE CART
 * ✅ allow 0 (for removing item)
 */
const updateCartSchema = Joi.object({
  menuItemId: Joi.string()
    .required()
    .custom(objectId)
    .messages({
      "string.base": "Menu item ID must be a string",
      "any.required": "Menu item ID is required",
    }),

  quantity: Joi.number()
    .integer()
    .min(0) // IMPORTANT
    .required()
    .messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity cannot be negative",
      "any.required": "Quantity is required",
    }),
}).unknown(false)
  .messages({
    "object.unknown": "Invalid field provided",
  });;

/**
 * REMOVE ITEM
 * (comes from params)
 */
const removeItemSchema = Joi.object({
  menuItemId: Joi.string()
    .required()
    .custom(objectId)
    .messages({
      "string.base": "Menu item ID must be a string",
      "any.required": "Menu item ID is required",
    }),
});

module.exports = {
  addToCartSchema,
  updateCartSchema,
  removeItemSchema,
};