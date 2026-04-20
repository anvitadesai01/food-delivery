const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const { revenueController, getTopRestaurantsRevenue,mostOrderedItemsController,monthlyTrendsController } = require('../controllers/analytics.controller');
const { getDashboardOverview } = require('../controllers/admin.controller');


router.get("/dashboard/overview", protect, authorize("admin"), getDashboardOverview);

router.get("/revenue", protect, authorize("admin"), revenueController);



router.get(
    "/top-restaurants/revenue",
    protect,
    authorize("admin"),
    getTopRestaurantsRevenue
);


router.get(
  "/most-ordered-items",
  protect,
  authorize("admin"),
  mostOrderedItemsController
);


router.get(
  "/trends/monthly",
  protect,
  authorize("admin"),
  monthlyTrendsController
);


module.exports = router;

