const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const paymentQueue = require("../queues/payment.queue");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

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
        const payments = await Payment.find()
            .populate("orderId")
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, "All payments", payments));
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