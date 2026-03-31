const Joi = require("joi");
const mongoose = require("mongoose");

const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
    }
    return value;
};

const createMenuItemSchema = Joi.object({
    restaurantId: Joi.string()
        .required()
        .custom(objectId)
        .messages({
            "string.base": "Restaurant ID must be a string",
            "string.empty": "Restaurant ID is required",
            "any.required": "Restaurant ID is required",
            "any.invalid": "Invalid Restaurant ID",
        }),

    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "Item name must be a string",
            "string.empty": "Item name is required",
            "string.min": "Item name must be at least 2 characters",
            "string.max": "Item name cannot exceed 100 characters",
            "any.required": "Item name is required",
        }),

    price: Joi.number()
        .required()
        .min(1)
        .messages({
            "number.base": "Price must be a number",
            "number.min": "Price must be at least 1",
            "any.required": "Price is required",
        }),

    stock: Joi.number()
        .min(0)
        .optional()
        .messages({
            "number.base": "Stock must be a number",
            "number.min": "Stock cannot be negative",
        }),

    availability: Joi.boolean()
        .optional()
        .messages({
            "boolean.base": "Availability must be true or false",
        }),
})
    .unknown(false)
    .messages({
        "object.unknown": "Invalid field provided",
    });

module.exports = { createMenuItemSchema };