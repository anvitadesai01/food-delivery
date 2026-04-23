const express = require('express');
const router = express.Router();
const {protectJWT} = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const { revenueController, getTopRestaurantsRevenue,mostOrderedItemsController,monthlyTrendsController } = require('../controllers/analytics.controller');
const { getDashboardOverview } = require('../controllers/admin.controller');


router.get("/dashboard/overview", protectJWT, authorize("admin"), getDashboardOverview);

router.get("/revenue", protectJWT, authorize("admin"), revenueController);



router.get(
    "/top-restaurants/revenue",
    protectJWT,
    authorize("admin"),
    getTopRestaurantsRevenue
);


router.get(
  "/most-ordered-items",
  protectJWT,
  authorize("admin"),
  mostOrderedItemsController
);


router.get(
  "/trends/monthly",
  protectJWT,
  authorize("admin"),
  monthlyTrendsController
);


module.exports = router;

