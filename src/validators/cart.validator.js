const Joi = require("joi");
const objectId = require("../utlis/objectId.validator");


const addToCartSchema = Joi.object({
  menuItemId: Joi.string()
    .required()
    .custom(objectId)
    .messages({
      "any.required": "menuItemId is required",
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "Quantity must be a number",
      "number.min": "Quantity must be at least 1",
      "any.required": "Quantity is required",
    }),
});

module.exports = {addToCartSchema}