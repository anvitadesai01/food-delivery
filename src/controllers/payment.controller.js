const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const paymentQueue = require("../queues/payment.queue");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");
const redisClient = require("../config/redis");

const invalidatePaymentCache = async () => {
    let cursor = "0";

    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, {
            MATCH: "payments:*",
            COUNT: 100,
        });

        cursor = nextCursor;

        if (keys.length) {
            await redisClient.del(keys);
        }
    } while (cursor !== "0");
};

/**
 * GET PAYMENT BY ORDER ID
 */
const getPaymentByOrderId = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const { orderId } = req.params;

        if (!userId) throw new ApiError(401, "Unauthorized");

        const query =
            req.user.role === "admin"
                ? { _id: orderId }
                : { _id: orderId, userId };

        const order = await Order.findOne(query);
        if (!order) throw new ApiError(404, "Order not found");

        const payment = await Payment.findOne({ orderId });
        if (!payment) throw new ApiError(404, "Payment not found");

        return res
            .status(200)
            .json(new ApiResponse(200, "Payment fetched", payment));
    } catch (err) {
        next(err);
    }
};
/**
 * RETRY PAYMENT
 */
const retryPayment = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const { orderId } = req.body;

        if (!userId) throw new ApiError(401, "Unauthorized");

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) throw new ApiError(404, "Order not found");

        const payment = await Payment.findOne({ orderId });
        if (!payment) throw new ApiError(404, "Payment not found");

        if (payment.status !== "failed") {
            throw new ApiError(400, "Only failed payments can be retried");
        }

        // reset
        payment.status = "pending";
        await payment.save();

        order.paymentStatus = "pending";
        await order.save();
        await invalidatePaymentCache();

        // PUSH AGAIN TO QUEUE
        await paymentQueue.add(
            { orderId },
            {
                attempts: 3,
                backoff: 5000,
            }
        );

        return res
            .status(200)
            .json(new ApiResponse(200, "Payment retry initiated"));
    } catch (err) {
        next(err);
    }
};

/**
 * ADMIN → ALL PAYMENTS
 */

const getAllPayments = async (req, res, next) => {
    try {
        let { page = 1, limit = 10 } = req.query;

        page = parseInt(page, 10);
        limit = parseInt(limit, 10);

        if (Number.isNaN(page) || page < 1) page = 1;
        if (Number.isNaN(limit) || limit < 1 || limit > 100) limit = 10;

        const skip = (page - 1) * limit;
        const cacheKey = `payments:page:${page}:limit:${limit}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res
                .status(200)
                .json(new ApiResponse(200, "Payments fetched (cache)", JSON.parse(cachedData)));
        }

        const [payments, total, summary] = await Promise.all([
            Payment.find()
                .populate({
                    path: "orderId",
                    select: "totalAmount status paymentStatus createdAt",
                    populate: [
                        { path: "restaurantId", select: "name" },
                        { path: "userId", select: "name email" },
                    ],
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Payment.countDocuments(),
            Payment.aggregate([
                {
                    $group: {
                        _id: null,
                        totalPayments: { $sum: 1 },
                        successCount: {
                            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
                        },
                        pendingCount: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                        },
                        failedCount: {
                            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
                        },
                        refundedCount: {
                            $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
                        },
                    },
                },
            ]),
        ]);

        const payload = {
            data: payments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
            summary: summary[0] || {
                totalPayments: 0,
                successCount: 0,
                pendingCount: 0,
                failedCount: 0,
                refundedCount: 0,
            },
        };

        await redisClient.setEx(
            cacheKey,
            60,
            JSON.stringify(payload)
        );

        return res
            .status(200)
            .json(new ApiResponse(200, "Payments fetched", payload));

    } catch (err) {
        next(err);
    }
};

/**
 * ADMIN → FAILED PAYMENTS
 */
const getFailedPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ status: "failed" })
            .populate("orderId")
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, "Failed payments", payments));
    } catch (err) {
        next(err);
    }
};

/**
 * ADMIN → REFUND
 */
const refundPayment = async (req, res, next) => {
    try {
        const { orderId } = req.body;

        const payment = await Payment.findOne({ orderId });
        if (!payment) throw new ApiError(404, "Payment not found");

        if (payment.status !== "success") {
            throw new ApiError(400, "Only successful payments can be refunded");
        }
        payment.status = "refunded";
        await payment.save();

        await Order.findByIdAndUpdate(orderId, {
            paymentStatus: "refunded",
        });
        await invalidatePaymentCache();

        return res
            .status(200)
            .json(new ApiResponse(200, "Refund processed"));
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPaymentByOrderId,
    retryPayment,
    getAllPayments,
    getFailedPayments,
    refundPayment,
};
