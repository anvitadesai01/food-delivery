/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment APIs
 */

/**
 * @swagger
 * /payments/retry:
 *   post:
 *     summary: Retry failed payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 64f123abc123abc123abc123
 *     responses:
 *       200:
 *         description: Payment retried successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment retried successfully
 *       400:
 *         description: Bad request or payment not in failed state
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /payments/all:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payments fetched
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                         example: 64f123abc123abc123abc123
 *                       status:
 *                         type: string
 *                         example: success
 *                       amount:
 *                         type: number
 *                         example: 999.99
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 47000
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 4700
 *
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /payments/failed:
 *   get:
 *     summary: Get failed payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of failed payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                         example: 64f123abc123abc123abc123
 *                       status:
 *                         type: string
 *                         example: failed
 *                       reason:
 *                         type: string
 *                         example: Insufficient funds
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Refund a payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 64f123abc123abc123abc123
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment refunded successfully
 *       400:
 *         description: Bad request or payment not eligible for refund
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /payments/status:
 *   patch:
 *     summary: Update payment status
 *     description: Updates the status of a payment and its associated order. Admin access required.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - status
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order/payment to update
 *                 example: "65f123abc456def789"
 *               status:
 *                 type: string
 *                 enum: [pending, success, failed, refunded]
 *                 description: The new status for the payment
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Payment status updated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     oldStatus:
 *                       type: string
 *                     newStatus:
 *                       type: string
 *       400:
 *         description: Invalid payment status provided
 *       404:
 *         description: Payment record not found
 *       500:
 *         description: Internal server error
 */



/**
 * @swagger
 * /payments/{orderId}:
 *   get:
 *     summary: Get payment status by order ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the order
 *         example: 64f123abc123abc123abc123
 *     responses:
 *       200:
 *         description: Payment details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: 64f123abc123abc123abc123
 *                     status:
 *                       type: string
 *                       example: success
 *                     amount:
 *                       type: number
 *                       example: 499.99
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       404:
 *         description: Payment not found for the given order ID
 *       500:
 *         description: Internal server error
 */