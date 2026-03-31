const orderService = require("../services/order.service");
const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

// PLACE ORDER
const placeOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder(
      req.user._id,
      req.body.paymentMethod
    );

    if (!order) {
      throw new ApiError(400, "Order could not be placed");
    }

    return res
      .json(new ApiResponse(201, "Order placed successfully", order));
  } catch (err) {
    next(err);
  }
};

// GET ORDER BY ID
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return res
      .json(new ApiResponse(200, "Order fetched successfully", order));
  } catch (err) {
    next(err);
  }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status
    );

    if (!order) {
      throw new ApiError(400, "Failed to update order status");
    }

    return res
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