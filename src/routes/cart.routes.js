const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");

const {
  addItemToCart,
  updateCart,
  removeItem,
  getUserCart
} = require("../controllers/cart.controller");
const validate = require("../middlewares/validate.middleware");
const { addToCartSchema } = require("../validators/cart.validation");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart Management
 */

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menuItemId, quantity]
 *             properties:
 *               menuItemId:
 *                 type: string
 *                 example: "65f123abc123abc123abc123"
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Invalid input / stock issue
 *       401:
 *         description: Unauthorized
 */
router.post("/",validate(addToCartSchema),protect, addItemToCart);

/**
 * @swagger
 * /cart:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menuItemId, quantity]
 *             properties:
 *               menuItemId:
 *                 type: string
 *                 example: "65f123abc123abc123abc123"
 *               quantity:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart updated
 *       404:
 *         description: Item not found in cart
 */
router.put("/", protect, updateCart);

/**
 * @swagger
 * /cart/{menuItemId}:
 *   delete:
 *     summary: Remove item from cart 
 *     tags: [Cart]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: Cart or item not found
 */
router.delete("/:menuItemId", protect, removeItem);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, getUserCart);

module.exports = router;