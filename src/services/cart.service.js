const Cart = require("../models/cart.model");
const MenuItem = require("../models/menuItem.model");
const ApiError = require("../utlis/ApiError");

const addToCart = async (userId, { menuItemId, quantity }) => {
  const item = await MenuItem.findById(menuItemId);

  if (!item) throw new ApiError(404, "Item not found");

  if (!item.availability) {
    throw new ApiError(400, "Item not available");
  }

  if (item.stock < quantity) {
    throw new ApiError(400, "insufficient stock");
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [{ menuItemId, quantity }],
    });
    return cart;
  }

  const existingItem = cart.items.find(
    (i) => i.menuItemId.toString() === menuItemId.toString(),
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
  return await cart.populate("items.menuItemId","name price");
};

const updateCartItem = async (userId, { menuItemId, quantity }) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.find((i) => i.menuItemId.toString() === menuItemId);

  if (!item) throw new ApiError(404, "Item not in cart");

  const menuItem = await MenuItem.findById(menuItemId);

  if(!menuItem){
    throw new ApiError(400, "Item not found");
  }

  if (quantity > menuItem.stock) {
    throw new ApiError(400, "Insufficient stock");
  }

  item.quantity = quantity;

  await cart.save();
  return cart;
};

const removeFromCart = async (userId, menuItemId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter(
    i => i.menuItemId.toString() !== menuItemId
  );

  await cart.save();
  return cart;
};

const getCart = async (userId) => {
  const cart = await Cart.findOne({ userId })
    .populate("items.menuItemId", "name price");

  if (!cart) return { items: [] };

  return cart;
};

module.exports = { addToCart, updateCartItem, removeFromCart, getCart }
