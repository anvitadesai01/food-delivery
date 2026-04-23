const express = require("express");
const router = express.Router();

const {protectJWT} = require("../middlewares/auth.middleware");

const {
  addItemToCart,
  updateCart,
  removeItem,
  getUserCart
} = require("../controllers/cart.controller");
const validate = require("../middlewares/validate.middleware");
const { addToCartSchema , updateCartSchema, removeItemSchema} = require("../validators/cart.validator");

router.post("/",protectJWT,validate(addToCartSchema), addItemToCart);

router.put("/", protectJWT,validate(updateCartSchema),  updateCart);


router.delete("/:menuItemId",  protectJWT,validate(removeItemSchema), removeItem);


router.get("/", protectJWT, getUserCart);

module.exports = router;
