const MenuItem = require('../models/menuItem.model');
const ApiError = require('../utlis/ApiError');
const Restaurant = require('../models/restaurant.model')
const redisClient = require("../config/redis");


// GET MENU BY RESTAURANT

const getMenuByRestaurant = async (restaurantId) => {
  const CACHE_KEY = `menu:${restaurantId}`;

  // 1. Check cache
  const cachedMenu = await redisClient.get(CACHE_KEY);

  if (cachedMenu) {
    console.log("Menu Cache HIT");
    return JSON.parse(cachedMenu);
  }

  console.log("Menu Cache MISS → DB");

  const menu = await MenuItem.find({
    restaurantId,
    availability: true,
    stock: { $gt: 0 },
  }).select("name price stock availability");

  if (!menu.length) {
    throw new ApiError(404, "No menu items found");
  }

  // 2. Store in Redis (TTL 60 sec)
  await redisClient.setEx(CACHE_KEY, 60, JSON.stringify(menu));

  return menu;
};

// CREATE MENU ITEM
const createMenuItemHandler = async (data) => {
  const { restaurantId, name, price, stock, availability } = data;

  const restaurant = await Restaurant.findById(restaurantId)

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found")
  }

  const menuItem = await MenuItem.create({
    restaurantId,
    name,
    price,
    stock,
    availability,
  });

  await redisClient.del(`menu:${restaurantId}`);

  return menuItem;
};

// UPDATE MENU ITEM
const updateMenuItemHandler = async (id, data) => {
  if (data.stock === 0) {
    data.availability = false
  }
  const menuItem = await MenuItem.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );

  if (!menuItem) {
    throw new ApiError(404, 'Menu item not found');
  }
  await redisClient.del(`menu:${menuItem.restaurantId}`);
  return menuItem;
};

// DELETE MENU ITEM
const deleteMenuItemHandler = async (id) => {
  const menuItem = await MenuItem.findByIdAndDelete(id);

  if (!menuItem) {
    throw new ApiError(404, 'Menu item not found');
  }
  await redisClient.del(`menu:${menuItem.restaurantId}`);
  return true;
};


module.exports = {
  getMenuByRestaurant,
  createMenuItemHandler,
  deleteMenuItemHandler,
  updateMenuItemHandler
};