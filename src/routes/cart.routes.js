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
const { addToCartSchema } = require("../validators/cart.validation");

router.post("/",validate(addToCartSchema),protect, addItemToCart);

router.put("/", protect, updateCart);


router.delete("/:menuItemId", protect, removeItem);


router.get("/", protect, getUserCart);

module.exports = router;