const {
  createRestaurantHandler,
  updateRestauranthandler,
  deleteRestaurantHandler,
  getRestaurants,
  getTopRestaurants,
} = require("../services/restaurant.service");

const ApiResponse = require("../utlis/ApiResponse");

// CREATE
const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await createRestaurantHandler(req.body);

    res
      .json(new ApiResponse(201, "Restaurant created", restaurant));
  } catch (err) {
    next(err);
  }
};

// UPDATE
const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await updateRestauranthandler(req.params.id, req.body);

    res.json(new ApiResponse(200, "Restaurant updated", restaurant));
  } catch (err) {
    next(err);
  }
};

// DELETE
const deleteRestaurant = async (req, res, next) => {
  try {
    await deleteRestaurantHandler(req.params.id);

    res.json(new ApiResponse(200, "Restaurant deleted"));
  } catch (err) {
    next(err);
  }
};

const getAllRestaurants = async (req, res, next) => {
  try {
    const result = await getRestaurants(req.query);

    const message =
      result.total === 0 ? "No restaurants found" : "Restaurants fetched";

    res.json(new ApiResponse(200, message, result));
  } catch (err) {
    next(err);
  }
};

const getTopRestaurantsHandler = async (req, res, next) => {
  try {
    const data = await getTopRestaurants();

    res.json(new ApiResponse(200, "Top restaurants fetched", data));
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
