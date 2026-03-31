const {
  getMenuByRestaurant,
  createMenuItemHandler,
  deleteMenuItemHandler,
  updateMenuItemHandler,
} = require("../services/menuItem.service");
const ApiResponse = require("../utlis/ApiResponse");

const getRestaurantMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await getMenuByRestaurant(id);

    res.json(new ApiResponse(200, "Menu fetched successfully", menu));
  } catch (err) {
    next(err);
  }
};

// CREATE
const createMenuItem = async (req, res, next) => {
  try {
    const menuItem = await createMenuItemHandler(req.body);

    res.status(201).json(new ApiResponse(201, "Menu item created", menuItem));
  } catch (err) {
    next(err);
  }
};

// UPDATE
const updateMenuItem = async (req, res, next) => {
  try {
    const menuItem = await updateMenuItemHandler(req.params.id, req.body);

    res.json(new ApiResponse(200, "Menu item updated", menuItem));
  } catch (err) {
    next(err);
  }
};

// DELETE
const deleteMenuItem = async (req, res, next) => {
  try {
    await deleteMenuItemHandler(req.params.id);

    res.json(new ApiResponse(200, "Menu item deleted"));
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
