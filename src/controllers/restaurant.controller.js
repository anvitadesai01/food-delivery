const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const redisClient = require("../config/redis");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

//  safer check
const isApiRequest = (req) => req.baseUrl.startsWith("/api");

/**
 * Invalidate Cache 
 */
const invalidateRestaurantCache = async () => {
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redisClient.scan(cursor, {
      MATCH: "restaurants:*",
      COUNT: 100,
    });

    cursor = nextCursor;

    if (keys.length) {
      await redisClient.del(keys);
    }
  } while (cursor !== "0");

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
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    await MenuItem.deleteMany({ restaurantId: req.params.id });
    await invalidateRestaurantCache();

    return res.json(
      new ApiResponse(200, "Restaurant deleted")
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL RESTAURANTS 
 */
const getAllRestaurants = async (req, res, next) => {
  try {
    const CACHE_KEY = `restaurants:${JSON.stringify(req.query)}`;

    let cachedData = await redisClient.get(CACHE_KEY);

    let result;

    if (cachedData) {
      console.log("Cache HIT");
      result = JSON.parse(cachedData);
    } else {
      console.log("Cache MISS -> DB");

      let {
        page = 1,
        limit = 10,
        location,
        cuisine,
        sort = "-rating -createdAt",
        search
      } = req.query;

      page = Number(page);
      limit = Number(limit);

      if (Number.isNaN(page) || page < 1) page = 1;
      if (Number.isNaN(limit) || limit < 1) limit = 10;

      const MAX_LIMIT = 20;
      if (limit > MAX_LIMIT) limit = MAX_LIMIT;

      const allowedSortFields = ["rating", "createdAt"];

      const sortFields = sort.split(" ").filter((field) => {
        const cleanField = field.replace("-", "");
        return allowedSortFields.includes(cleanField);
      });

      const safeSort = sortFields.join(" ") || "-rating";

      const filter = {};

      if (search) {
        const regex = new RegExp(search, "i");

        let restaurantIdsFromMenu = [];

        try {
          const menuItems = await MenuItem.find({
            name: regex,
          }).select("restaurantId");

          restaurantIdsFromMenu = menuItems.map(
            (item) => item.restaurantId
          );
        } catch (err) {
          console.log("Menu search error:", err.message);
        }

        filter.$or = [
          { name: regex },
          { cuisine: regex },
          { location: regex },
          { _id: { $in: restaurantIdsFromMenu } },
        ];
      }
      // 🔥 normal filters (optional, still works)
      if (location) {
        filter.location = { $regex: location, $options: "i" };
      }

      if (cuisine) {
        const cuisines = Array.isArray(cuisine) ? cuisine : [cuisine];
        filter.cuisine = {
          $in: cuisines.map((c) => new RegExp(c, "i")),
        };
      }

      const skip = (page - 1) * limit;

      const restaurants = await Restaurant.find(filter)
        .select("name location cuisine rating")
        .sort(safeSort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Restaurant.countDocuments(filter);

      result = {
        total,
        page,
        limit,
        sort: safeSort,
        filters: {
          location: location || "",
          cuisine: Array.isArray(cuisine)
            ? cuisine.join(", ")
            : cuisine || "",
          search: search || "",
        },
        data: restaurants,
      };

      await redisClient.set(CACHE_KEY, JSON.stringify(result), {
        EX: 90,
      });
    }

    const message =
      result.total === 0 ? "No restaurants found" : "Restaurants fetched";

    if (!isApiRequest(req)) {
      return res.render("pages/restaurants", {
        title: "Food Delivery | Restaurants",
        currentPath: req.path,
        restaurants: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        sort: result.sort,
        filters: result.filters,
      });
    }

    return res.json(
      new ApiResponse(200, message, result)
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

    let cachedData = await redisClient.get(CACHE_KEY);

    let restaurants;

    if (cachedData) {
      console.log("Cache HIT");
      restaurants = JSON.parse(cachedData);
    } else {
      console.log("Cache MISS -> DB");

      restaurants = await Restaurant.find({
        rating: { $gte: 4 },
      })
        .sort("-rating")
        .limit(10)
        .lean();

      await redisClient.set(CACHE_KEY, JSON.stringify(restaurants), {
        EX: 90,
      });
    }

    if (!isApiRequest(req)) {
      return res.render("pages/restaurants", {
        title: "Top Restaurants",
        currentPath: req.path,
        restaurants,
      });
    }

    return res.json(
      new ApiResponse(200, "Top restaurants fetched", restaurants)
    );
  } catch (err) {
    next(err);
  }
};

const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    return res.json(
      new ApiResponse(200, "Restaurant fetched", restaurant)
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
  getRestaurantById
};