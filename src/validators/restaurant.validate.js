const Joi = require("joi");

const createRestaurantSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "Name must be a string",
            "string.empty": "Restaurant name is required",
            "string.min": "Name should have at least 2 characters",
            "string.max": "Name cannot exceed 100 characters",
            "any.required": "Restaurant name is required",
        }),

    location: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "Location must be a string",
            "string.empty": "Location is required",
            "string.min": "Location should have at least 2 characters",
            "string.max": "Location cannot exceed 100 characters",
            "any.required": "Location is required",
        }),

    cuisine: Joi.array()
        .items(
            Joi.string().trim().min(2).messages({
                "string.base": "Cuisine must be a string",
                "string.empty": "Cuisine cannot be empty",
                "string.min": "Cuisine must have at least 2 characters",
            })
        )
        .min(1)
        .required()
        .messages({
            "array.base": "Cuisine must be an array",
            "array.min": "At least one cuisine is required",
            "any.required": "Cuisine is required",
        }),

    rating: Joi.number()
        .min(0)
        .max(5)
        .optional()
        .messages({
            "number.base": "Rating must be a number",
            "number.min": "Rating cannot be less than 0",
            "number.max": "Rating cannot be greater than 5",
        }),
})
    .unknown(false)
    .messages({
        "object.unknown": "You have sent an invalid field",
    });

module.exports = { createRestaurantSchema };