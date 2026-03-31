const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const redisClient = require("../config/redis");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

/**
 *  Invalidate Restaurant Cache
 */
const invalidateRestaurantCache = async () => {
  const keys = await redisClient.keys("restaurants:*");

  if (keys.length) {
    await redisClient.del(keys);
  }

  await redisClient.del("top_restaurants");
};

/**
 * CREATE RESTAURANT
 */
const createRestaurant = async (req, res, next) => {
  try {
    const { name, location, cuisine, rating } = req.body;

    const restaurant = await Restaurant.create({
      name,
      location,
      cuisine,
      rating,
    });

    await invalidateRestaurantCache();

    return res.json(
      new ApiResponse(201, "Restaurant created", restaurant)
    );
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE RESTAURANT
 */
const updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    await invalidateRestaurantCache();

    return res.json(
      new ApiResponse(200, "Restaurant updated", restaurant)
    );
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE RESTAURANT
 */
const deleteRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    // delete related menu items
    await MenuItem.deleteMany({ restaurantId: id });

    await invalidateRestaurantCache();

    return res.json(
      new ApiResponse(200, "Restaurant deleted")
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL RESTAURANTS (WITH CACHE + FILTER + PAGINATION)
 */
const getAllRestaurants = async (req, res, next) => {
  try {
    const CACHE_KEY = `restaurants:${JSON.stringify(req.query)}`;

    //  1. Cache check
    const cachedData = await redisClient.get(CACHE_KEY);

    if (cachedData) {
      console.log("Cache HIT");

      const parsed = JSON.parse(cachedData);

      return res.json(
        new ApiResponse(
          200,
          parsed.total === 0
            ? "No restaurants found"
            : "Restaurants fetched",
          parsed
        )
      );
    }

    console.log("Cache MISS → DB");

    let {
      page = 1,
      limit = 10,
      location,
      cuisine,
      sort = "-rating -createdAt",
    } = req.query;

    //  sanitize pagination
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const MAX_LIMIT = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    //  safe sorting
    const allowedSortFields = ["rating", "createdAt"];

    const sortFields = sort.split(" ").filter((field) => {
      const cleanField = field.replace("-", "");
      return allowedSortFields.includes(cleanField);
    });

    const safeSort = sortFields.join(" ") || "-rating";

    //  filters
    const filter = {};

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (cuisine) {
      const cuisines = Array.isArray(cuisine) ? cuisine : [cuisine];
      const regexCuisines = cuisines.map((c) => new RegExp(c, "i"));
      filter.cuisine = { $in: regexCuisines };
    }

    const skip = (page - 1) * limit;

    const restaurants = await Restaurant.find(filter)
      .select("name location cuisine rating")
      .sort(safeSort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Restaurant.countDocuments(filter);

    const result = {
      total,
      page,
      limit,
      data: restaurants,
    };

    //  2. Cache result
    await redisClient.set(CACHE_KEY, JSON.stringify(result), { EX: 90 });

    return res.json(
      new ApiResponse(
        200,
        total === 0 ? "No restaurants found" : "Restaurants fetched",
        result
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET TOP RESTAURANTS
 */
const getTopRestaurantsHandler = async (req, res, next) => {
  try {
    const CACHE_KEY = "top_restaurants";

    const cachedData = await redisClient.get(CACHE_KEY);

    if (cachedData) {
      console.log("Cache HIT");

      return res.json(
        new ApiResponse(
          200,
          "Top restaurants fetched",
          JSON.parse(cachedData)
        )
      );
    }

    console.log("Cache MISS → DB");

    const restaurants = await Restaurant.find({
      rating: { $gte: 4 },
    })
      .sort("-rating")
      .limit(15)
      .lean();

    await redisClient.set(CACHE_KEY, JSON.stringify(restaurants), {
      EX: 90,
    });

    return res.json(
      new ApiResponse(200, "Top restaurants fetched", restaurants)
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  getTopRestaurantsHandler,
};