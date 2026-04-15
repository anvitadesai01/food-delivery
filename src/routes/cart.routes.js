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
const { addToCartSchema , updateCartSchema, removeItemSchema} = require("../validators/cart.validator");

router.post("/",protect,validate(addToCartSchema), addItemToCart);

router.put("/", protect,validate(updateCartSchema),  updateCart);


router.delete("/:menuItemId",  protect,validate(removeItemSchema), removeItem);


router.get("/", protect, getUserCart);

module.exports = router;
