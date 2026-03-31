const {
  addToCart,
  updateCartItem,
  removeFromCart,
  getCart,
} = require("../services/cart.service");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

// ADD ITEM
const addItemToCart = async (req, res, next) => {
  try {
    const cart = await addToCart(req.user.id, req.body);

    return res
      .json(new ApiResponse(200, "Item added to cart", cart));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

// UPDATE CART
const updateCart = async (req, res, next) => {
  try {
    const cart = await updateCartItem(req.user.id, req.body);

    return res
      .json(new ApiResponse(200, "Cart updated", cart));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

// REMOVE ITEM
const removeItem = async (req, res, next) => {
  try {
    const cart = await removeFromCart(
      req.user.id,
      req.params.menuItemId
    );

    return res
      .json(new ApiResponse(200, "Item removed from cart", cart));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

// GET CART
const getUserCart = async (req, res, next) => {
  try {
    const cart = await getCart(req.user.id);

    if (!cart || cart.items.length === 0) {
      return res
        .json(new ApiResponse(200, "Cart is empty", cart));
    }

    return res
      .json(new ApiResponse(200, "Cart fetched", cart));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

module.exports = {
  addItemToCart,
  removeItem,
  updateCart,
  getUserCart,
};