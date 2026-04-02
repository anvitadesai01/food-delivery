const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const MenuItem = require("../models/menuItem.model");
const Payment = require("../models/payment.model");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

/**
 * PLACE ORDER (TRANSACTION SAFE)
 */
const placeOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?._id;
    const { paymentMethod } = req.body;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!["online", "cod"].includes(paymentMethod)) {
      throw new ApiError(400, "Invalid payment method");
    }

    const cart = await Cart.findOne({ userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    let totalAmount = 0;
    const orderItems = [];

    // 🔥 get first item for restaurantId
    const firstItem = await MenuItem.findById(cart.items[0].menuItemId);

    if (!firstItem) {
      throw new ApiError(400, "Invalid cart items");
    }

    // 🔥 stock check + deduction (atomic)
    for (const item of cart.items) {
      const updatedItem = await MenuItem.findOneAndUpdate(
        {
          _id: item.menuItemId,
          stock: { $gte: item.quantity },
          availability: true,
        },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      if (!updatedItem) {
        throw new ApiError(400, "Item out of stock or unavailable");
      }

      totalAmount += updatedItem.price * item.quantity;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      });
    }

    // ✅ create order
    const order = new Order({
      userId,
      restaurantId: firstItem.restaurantId,
      items: orderItems,
      totalAmount,
      status: "placed",
      paymentStatus: "pending",
    });

    await order.save({ session });

    // ✅ payment
    const paymentStatus = paymentMethod === "online" ? "success" : "pending";

    await Payment.create(
      [
        {
          orderId: order._id,
          status: paymentStatus,
          method: paymentMethod,
        },
      ],
      { session }
    );

    order.paymentStatus = paymentStatus;
    await order.save({ session });

    // ✅ clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, "Order placed successfully", order));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

/**
 * GET ORDER BY ID (USER AUTHORIZATION ENFORCED)
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { id: orderId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "items.menuItemId",
        select: "name price",
      })
      .populate("userId", "email");

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // 🔒 IMPORTANT: only owner can view
    if (order.userId._id.toString() !== userId.toString()) {
      throw new ApiError(403, "Access denied");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Order fetched successfully", order));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

/**
 * UPDATE ORDER STATUS (WITH VALID TRANSITIONS)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const { status } = req.body;

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const validTransitions = {
      placed: ["preparing"],
      preparing: ["delivered"],
      delivered: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new ApiError(
        400,
        `Invalid status transition from ${order.status} to ${status}`
      );
    }

    order.status = status;
    await order.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Order status updated", order));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

module.exports = {
  placeOrder,
  getOrderById,
  updateOrderStatus,
};