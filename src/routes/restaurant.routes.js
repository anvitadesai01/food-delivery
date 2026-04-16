const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  getTopRestaurantsHandler,
  getRestaurantById
} = require("../controllers/restaurant.controller");
const { getRestaurantMenu } = require("../controllers/menuItem.controller");
const validate = require("../middlewares/validate.middleware");
const { createRestaurantSchema } = require("../validators/restaurant.validator");



router.post("/", protect, authorize("admin"),validate(createRestaurantSchema), createRestaurant);
router.put("/:id", protect, authorize("admin"), updateRestaurant);
router.delete("/:id", protect, authorize("admin"), deleteRestaurant);
router.get("/", getAllRestaurants);
router.get("/top", getTopRestaurantsHandler);
router.get("/:id", getRestaurantById); // ✅ ADD THIS

router.get("/:id/menu", getRestaurantMenu);





module.exports = router;
