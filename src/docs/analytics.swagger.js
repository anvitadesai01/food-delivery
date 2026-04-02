/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Admin Analytics APIs
 */

/**
 * @swagger
 * /analytics/revenue:
 *   get:
 *     summary: Revenue calculation
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Revenue fetched successfully
 */

/**
 * @swagger
 * /analytics/top-restaurants/revenue:
 *   get:
 *     summary: Get top 5 restaurants by revenue
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top restaurants by revenue fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Top restaurants by revenue fetched successfully
 *               data:
 *                 - restaurantId: "64abc123"
 *                   restaurantName: "Dominos"
 *                   totalRevenue: 50000
 *                   totalOrders: 120
 */


/**
 * @swagger
 * /analytics/most-ordered-items:
 *   get:
 *     summary: Get top 5 most ordered menu items
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Most ordered items fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Most ordered items fetched successfully
 *               data:
 *                 - menuItemId: "64abc123"
 *                   name: "Burger"
 *                   price: 120
 *                   totalOrdered: 300
 */


/**
 * @swagger
 * /analytics/trends/monthly:
 *   get:
 *     summary: Get monthly order & revenue trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           example: 2026-03-01
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           example: 2026-03-31
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Monthly trends fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */