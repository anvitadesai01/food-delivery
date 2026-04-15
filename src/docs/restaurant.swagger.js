
/**
 * @swagger
 * tags:
 *   name: Restaurant
 *   description: Restaurant Management (Admin only)
 */

/**
 * @swagger
 * /restaurants:
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

/**
 * @swagger
 * /restaurants/{id}:
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

/**
 * @swagger
 * /restaurants/{id}:
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

/**
 * @swagger
 * /restaurants:
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

/**
 * @swagger
 * /restaurants/top:
 *   get:
 *     summary: Get top restaurants
 *     tags: [Get Restaurants]
 *     responses:
 *       200:
 *         description: Top restaurants fetched
 */

/**
 * @swagger
 * /restaurants/{id}/menu:
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