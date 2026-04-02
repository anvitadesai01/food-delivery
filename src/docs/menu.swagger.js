/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu Management (Admin only)
 */

/**
 * @swagger
 * /menu:
 *   post:
 *     summary: Create a new menu item
 *     description: Admin can create a menu item for a restaurant
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - name
 *               - price
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 example: "64f123abc456def789000001"
 *               name:
 *                 type: string
 *                 example: "Paneer Butter Masala"
 *               price:
 *                 type: number
 *                 example: 250
 *               stock:
 *                 type: number
 *                 example: 20
 *               availability:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * /menu/{id}:
 *   put:
 *     summary: Update a menu item
 *     description: Admin can update menu item details
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Menu item ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Veg Burger"
 *               price:
 *                 type: number
 *                 example: 120
 *               stock:
 *                 type: number
 *                 example: 10
 *               availability:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Menu item updated
 *       404:
 *         description: Menu item not found
 */

/**
 * @swagger
 * /menu/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     description: Admin can delete a menu item
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Menu item ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item deleted
 *       404:
 *         description: Menu item not found
 */