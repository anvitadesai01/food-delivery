const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const MenuItem = require("../models/menuItem.model");
const Payment = require("../models/payment.model");

const placeOrder = async (userId, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!["online", "cod"].includes(paymentMethod)) {
      throw new Error("Invalid payment method");
    }

    const cart = await Cart.findOne({ userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    let totalAmount = 0;
    const orderItems = [];
    const firstItem = await MenuItem.findById(cart.items[0].menuItemId);


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
        throw new Error("Item out of stock or unavailable");
      }

      totalAmount += updatedItem.price * item.quantity;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      });
    }

    const order = new Order({
      userId,
      restaurantId:firstItem.restaurantId,  
      items: orderItems,
      totalAmount,
      status: "placed",
      paymentStatus: "pending",
    });

    await order.save({ session });

    let paymentStatus = paymentMethod === "online" ? "success" : "pending";

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

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const getOrderById = async (orderId) => {
  return await Order.findById(orderId)
    .populate({
      path: "items.menuItemId",
      select: "name price", 
    })
    .populate("userId", "email")
    .lean(); 
};

const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);

  if (!order) throw new Error("Order not found");

  const validTransitions = {
    placed: ["preparing"],
    preparing: ["delivered"],
    delivered: [], // final state
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new Error(
      `Invalid status transition from ${order.status} to ${status}`,
    );
  }

  order.status = status;
  await order.save();

  return order;
};

module.exports = {
  placeOrder,
  getOrderById,
  updateOrderStatus,
};
