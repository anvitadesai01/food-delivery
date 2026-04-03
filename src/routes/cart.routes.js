const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");

const {
  addItemToCart,
  updateCart,
  removeItem,
  getUserCart
} = require("../controllers/cart.controller");
const validate = require("../middlewares/validate.middleware");
const { addToCartSchema ,u, updateCartSchema, removeItemSchema} = require("../validators/cart.validator");

router.post("/",validate(addToCartSchema),protect, addItemToCart);

router.put("/", validate(updateCartSchema),protect,  updateCart);


router.delete("/:menuItemId", validate(removeItemSchema), protect, removeItem);


router.get("/", protect, getUserCart);

module.exports = router;