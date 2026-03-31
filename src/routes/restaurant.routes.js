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
} = require("../controllers/restaurant.controller");
const { getRestaurantMenu } = require("../controllers/menuItem.controller");
const validate = require("../middlewares/validate.middleware");
const { createRestaurantSchema } = require("../validators/restaurant.validate");

/**
 * @swagger
 * tags:
 *   name: Restaurant
 *   description: Restaurant Management (Admin only)
 */

/**
 * @swagger
 * /restaurant:
 *   post:
 *     summary: Create restaurant
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location, cuisine,rating]
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               cuisine:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Indian", "Chinese"]
 *               rating:
 *                  type: number
 *                  example: 4.2
 *     responses:
 *       201:
 *         description: Restaurant created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.post("/",validate(createRestaurantSchema), protect, authorize("admin"), createRestaurant);
/**
 * @swagger
 * /restaurant/{id}:
 *   put:
 *     summary: Update restaurant
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               cuisine:
 *                 type: array
 *                 items:
 *                    type: string
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Restaurant updated
 *       404:
 *         description: Not found
 */
router.put("/:id", protect, authorize("admin"), updateRestaurant);
/**
 * @swagger
 * /restaurant/{id}:
 *   delete:
 *     summary: Delete restaurant
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", protect, authorize("admin"), deleteRestaurant);
/**
 * @swagger
 * /restaurant:
 *   get:
 *     summary: Get restaurants
 *     tags: [Get Restaurants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         example: 10
 *
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         example: surat
 *
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         example: ["chinese", "indian"]
 *
 *     responses:
 *       200:
 *         description: Restaurants fetched
 */ 
router.get("/", getAllRestaurants);
/**
 * @swagger
 * /restaurant/top:
 *   get:
 *     summary: Get top restaurants
 *     tags: [Get Restaurants]
 *     responses:
 *       200:
 *         description: Top restaurants fetched
 */
router.get("/top", getTopRestaurantsHandler);

/**
 * @swagger
 * /restaurant/{id}/menu:
 *   get:
 *     summary: Get menu items for a restaurant
 *     tags: [Get Menu By Restaurant]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu fetched successfully
 *       404:
 *         description: No menu found
 */
router.get("/:id/menu", getRestaurantMenu);

module.exports = router;
