const Restaurant = require("../models/restaurant.model");
const ApiError = require("../utlis/ApiError");
const MenuItem = require("../models/menuItem.model");
const redisClient = require("../config/redis");

//  Invalidate all restaurant caches
const invalidateRestaurantCache = async () => {
  const keys = await redisClient.keys("restaurants:*");

  if (keys.length) {
    await redisClient.del(keys);
  }

  await redisClient.del("top_restaurants");
};

// CREATE
const createRestaurantHandler = async (data) => {
  const { name, location, cuisine, rating } = data;

  const restaurant = await Restaurant.create({
    name,
    location,
    cuisine,
    rating,
  });

  await invalidateRestaurantCache();

  return restaurant;
};

// UPDATE
const updateRestauranthandler = async (id, data) => {
  const restaurant = await Restaurant.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  await invalidateRestaurantCache();

  return restaurant;
};

// DELETE
const deleteRestaurantHandler = async (id) => {
  const restaurant = await Restaurant.findByIdAndDelete(id);

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  await MenuItem.deleteMany({ restaurantId: id });

  await invalidateRestaurantCache();

  return true;
};

// GET (with caching)
const getRestaurants = async (query) => {
  const CACHE_KEY = `restaurants:${JSON.stringify(query)}`;

  // 1. Check cache
  const cachedData = await redisClient.get(CACHE_KEY);

  if (cachedData) {
    console.log("Cache HIT");
    return JSON.parse(cachedData);
  }

  console.log("Cache MISS → DB");

  let {
    page = 1,
    limit = 10,
    location,
    cuisine,
    sort = "-rating -createdAt",
  } = query;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const MAX_LIMIT = 20;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const allowedSortFields = ["rating", "createdAt"];
  const sortFields = sort.split(" ").filter((field) => {
    const cleanField = field.replace("-", "");
    return allowedSortFields.includes(cleanField);
  });

  const safeSort = sortFields.join(" ") || "-rating";

  const filter = {};

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (cuisine) {
    const cuisines = Array.isArray(cuisine) ? cuisine : [cuisine];
    const regexCuisines = cuisines.map(c => new RegExp(c, 'i'));
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

  // 2. Cache result
  await redisClient.set(CACHE_KEY, JSON.stringify(result), { EX: 90 });

  return result;
};

// TOP RESTAURANTS
const getTopRestaurants = async () => {
  const CACHE_KEY = "top_restaurants";

  const cachedData = await redisClient.get(CACHE_KEY);

  if (cachedData) {
    console.log("Cache HIT");
    return JSON.parse(cachedData);
  }

  console.log("Cache MISS → DB");

  const restaurants = await Restaurant.find({
    rating: { $gte: 4 },
  })
    .sort("-rating")
    .limit(15)
    .lean();

  await redisClient.set(CACHE_KEY, JSON.stringify(restaurants), { ex: 90 });

  return restaurants;
};

module.exports = {
  createRestaurantHandler,
  updateRestauranthandler,
  deleteRestaurantHandler,
  getRestaurants,
  getTopRestaurants,
};