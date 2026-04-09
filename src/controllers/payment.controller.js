const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const paymentQueue = require("../queues/payment.queue");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");
const redisClient = require("../config/redis");

/**
 * GET PAYMENT BY ORDER ID
 */
const getPaymentByOrderId = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const { orderId } = req.params;

        if (!userId) throw new ApiError(401, "Unauthorized");

        const order = await Order.findOne({ _id: orderId, userId });
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
        //  pagination 
        let { page = 1, limit = 10 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        const skip = (page - 1) * limit;

        //  custom cache key
        const cacheKey = `payments:page:${page}:limit:${limit}`;

        // 🔍 1. Check cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Payments fetched (cache)",
                data: JSON.parse(cachedData),
            });
        }

        // Cache miss → DB call
        const payments = await Payment.find()
            .populate("orderId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        //  2. Store in Redis (TTL = 60 sec)
        await redisClient.setEx(
            cacheKey,
            60,
            JSON.stringify(payments)
        );

        return res.status(200).json({
            success: true,
            message: "Payments fetched",
            data: payments,
        });

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