const MenuItem = require("../models/menuItem.model");
const Restaurant = require("../models/restaurant.model");
const redisClient = require("../config/redis");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

/**
 * GET ALL AVAILABLE MENU ITEMS
 */
const getAllMenuItems = async (req, res, next) => {
  try {
    const { search, cuisine, page = 1, limit = 12 } = req.query;
    
    const query = {
      availability: true,
      stock: { $gt: 0 }
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const menuItems = await MenuItem.find(query)
      .populate('restaurantId', 'name location')
      .select('name price stock availability description restaurantId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MenuItem.countDocuments(query);

    return res.json(
      new ApiResponse(200, "Menu items fetched successfully", {
        data: menuItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      })
    );
  } catch (err) {
    next(err);
  }
};

const getAdminMenuItems = async (req, res, next) => {
  try {
    let { page = 1, limit = 20, search, restaurantId, availability } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1 || limit > 100) limit = 20;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    if (availability === "true" || availability === "false") {
      query.availability = availability === "true";
    }

    const skip = (page - 1) * limit;

    const [items, total, summary] = await Promise.all([
      MenuItem.find(query)
        .populate("restaurantId", "name location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MenuItem.countDocuments(query),
      MenuItem.aggregate([
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            activeItems: {
              $sum: { $cond: [{ $eq: ["$availability", true] }, 1, 0] },
            },
            lowStockItems: {
              $sum: { $cond: [{ $lte: ["$stock", 5] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    return res.json(
      new ApiResponse(200, "Admin menu items fetched successfully", {
        data: items,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        summary: summary[0] || {
          totalItems: 0,
          activeItems: 0,
          lowStockItems: 0,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

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
  getAllMenuItems,
  getAdminMenuItems,
  getRestaurantMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
