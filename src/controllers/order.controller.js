const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const MenuItem = require("../models/menuItem.model");
const Payment = require("../models/payment.model");
const orderQueue = require("../queues/order.queue");
const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

/**
 * PLACE ORDER (TRANSACTION SAFE)
 */
const placeOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let isTransactionCommitted = false;
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

    //  get first item for restaurantId
    const firstItem = await MenuItem.findById(cart.items[0].menuItemId);

    if (!firstItem) {
      throw new ApiError(400, "Invalid cart items");
    }

    //  stock check + deduction (atomic)
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

      const itemTotal = updatedItem.price * item.quantity;

      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      });
    }

    // ✅ ADD THIS HERE
    totalAmount = Number(totalAmount.toFixed(2));

    //  create order
    const order = new Order({
      userId,
      restaurantId: firstItem.restaurantId,
      items: orderItems,
      totalAmount,
      status: "placed",
      paymentStatus: "pending",
    });

    await order.save({ session });

    //  payment

    // Always pending initially
    await Payment.create(
      [
        {
          orderId: order._id,
          status: "pending",
          method: paymentMethod,
        },
      ],
      { session }
    );

    order.paymentStatus = "pending";
    await order.save({ session });
    //  clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    isTransactionCommitted = true;
    session.endSession();

    // AFTER transaction commit
    if (paymentMethod === "online") {
      await orderQueue.add(
        "cancel-order",
        { orderId: order._id },
        {
          delay: 10000,
          jobId: `cancel-${order._id}`,
          removeOnComplete: true,  // ✅ auto delete
          removeOnFail: true       // ✅ auto delete
        }
      );
    }
    return res
      .status(201)
      .json(new ApiResponse(201, "Order placed successfully", order));
  } catch (err) {
    if (!isTransactionCommitted) {
      await session.abortTransaction();
    }
    session.endSession();
    next(err);
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

    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
    })
      .populate({
        path: "items.menuItemId",
        select: "name price",
      })
      .populate("userId", "email");

    if (!order) {
      throw new ApiError(404, "Order not found");
    }


    return res
      .status(200)
      .json(new ApiResponse(200, "Order fetched successfully", order));
  } catch (err) {
    next(err)
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
    next(err);
  }
};

module.exports = {
  placeOrder,
  getOrderById,
  updateOrderStatus,
};