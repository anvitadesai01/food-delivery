const Cart = require("../models/cart.model");
const MenuItem = require("../models/menuItem.model");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

/**
 * ADD ITEM TO CART
 */
const addItemToCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { menuItemId, quantity } = req.body;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!menuItemId || !quantity || quantity <= 0) {
      throw new ApiError(400, "Invalid input data");
    }

    const item = await MenuItem.findById(menuItemId);

    if (!item) throw new ApiError(404, "Item not found");

    if (!item.availability) {
      throw new ApiError(400, "Item not available");
    }

    if (item.stock < quantity) {
      throw new ApiError(404, "Currently Item is Out of stock");
    }

    let cart = await Cart.findOne({ userId });

    // ✅ create cart if not exists
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ menuItemId, quantity }],
      });

      const populatedCart = await cart.populate(
        "items.menuItemId",
        "name price"
      );

      return res
        .status(201)
        .json(new ApiResponse(201, "Item added to cart", populatedCart));
    }

    // ✅ check existing item
    const existingItem = cart.items.find(
      (i) => i.menuItemId.toString() === menuItemId.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;

      if (existingItem.quantity > item.stock) {
        throw new ApiError(400, "Exceeds available stock");
      }
    } else {
      cart.items.push({ menuItemId, quantity });
    }

    await cart.save();

    const updatedCart = await cart.populate(
      "items.menuItemId",
      "name price"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Item added to cart", updatedCart));
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE CART ITEM
 */
const updateCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { menuItemId, quantity } = req.body;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!menuItemId || quantity == null || quantity < 0) {
      throw new ApiError(400, "Invalid input data");
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) throw new ApiError(404, "Cart not found");

    const item = cart.items.find(
      (i) => i.menuItemId.toString() === menuItemId.toString()
    );

    if (!item) throw new ApiError(404, "Item not in cart");

    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem) {
      throw new ApiError(404, "Item not found");
    }

    if (quantity > menuItem.stock) {
      throw new ApiError(400, "Insufficient stock");
    }

    // ✅ if quantity = 0 → remove item
    if (quantity === 0) {
      cart.items = cart.items.filter(
        (i) => i.menuItemId.toString() !== menuItemId.toString()
      );
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    const updatedCart = await cart.populate(
      "items.menuItemId",
      "name price"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Cart updated", updatedCart));
  } catch (err) {
    next(err);
  }
};

/**
 * REMOVE ITEM FROM CART
 */
const removeItem = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { menuItemId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!menuItemId) {
      throw new ApiError(400, "Menu item ID is required");
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) throw new ApiError(404, "Cart not found");

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (i) => i.menuItemId.toString() !== menuItemId.toString()
    );

    if (cart.items.length === initialLength) {
      throw new ApiError(404, "Item not in cart");
    }

    await cart.save();

    const updatedCart = await cart.populate(
      "items.menuItemId",
      "name price"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Item removed from cart", updatedCart));
  } catch (err) {
    next(err);
  }
};

/**
 * GET USER CART
 */
const getUserCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const cart = await Cart.findOne({ userId }).populate(
      "items.menuItemId",
      "name price"
    );

    if (!cart || cart.items.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "Cart is empty", { items: [] }));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Cart fetched", cart));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addItemToCart,
  updateCart,
  removeItem,
  getUserCart,
};