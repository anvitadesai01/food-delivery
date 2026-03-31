const MenuItem = require("../models/menuItem.model");
const Restaurant = require("../models/restaurant.model");
const redisClient = require("../config/redis");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

/**
 * GET MENU BY RESTAURANT (WITH CACHE)
 */
const getRestaurantMenu = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params;

    if (!restaurantId) {
      throw new ApiError(400, "Restaurant ID is required");
    }

    const CACHE_KEY = `menu:${restaurantId}`;

    //  1. Check cache
    const cachedMenu = await redisClient.get(CACHE_KEY);

    if (cachedMenu) {
      console.log("Menu Cache HIT");

      return res.json(
        new ApiResponse(
          200,
          "Menu fetched successfully",
          JSON.parse(cachedMenu)
        )
      );
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

    //  2. Cache result
    await redisClient.setEx(CACHE_KEY, 60, JSON.stringify(menu));

    return res.json(
      new ApiResponse(200, "Menu fetched successfully", menu)
    );
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE MENU ITEM
 */
const createMenuItem = async (req, res, next) => {
  try {
    const { restaurantId, name, price, stock, availability } = req.body;

    if (!restaurantId || !name || price == null) {
      throw new ApiError(400, "Required fields are missing");
    }

    //  check restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    const menuItem = await MenuItem.create({
      restaurantId,
      name,
      price,
      stock,
      availability,
    });

    //  invalidate cache
    await redisClient.del(`menu:${restaurantId}`);

    return res
      .status(201)
      .json(new ApiResponse(201, "Menu item created", menuItem));
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE MENU ITEM
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (!id) {
      throw new ApiError(400, "Menu item ID is required");
    }

    //  business logic
    if (data.stock === 0) {
      data.availability = false;
    }

    const menuItem = await MenuItem.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true, // 🔥 added for production safety
    });

    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }

    // invalidate cache
    await redisClient.del(`menu:${menuItem.restaurantId}`);

    return res.json(
      new ApiResponse(200, "Menu item updated", menuItem)
    );
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE MENU ITEM
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Menu item ID is required");
    }

    const menuItem = await MenuItem.findByIdAndDelete(id);

    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }

    // invalidate cache
    await redisClient.del(`menu:${menuItem.restaurantId}`);

    return res.json(
      new ApiResponse(200, "Menu item deleted")
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRestaurantMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};