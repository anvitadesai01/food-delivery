const Order = require("../models/order.model");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

/**
 * 1. REVENUE CONTROLLER (PAGINATED)
 */
const revenueController = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;

    const data = await Order.aggregate([
      { $match: { paymentStatus: "success" } },
      {
        $group: {
          _id: "$restaurantId",
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },
      {
        $project: {
          _id: 0,
          restaurantId: "$_id",
          restaurantName: "$restaurant.name",
          totalRevenue: 1,
          totalOrders: 1,
          averageOrderValue: { $round: ["$averageOrderValue", 2] },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    if (!data || data.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No records found", { data: [] }));
    }

    return res.status(200).json(
      new ApiResponse(200, "Revenue fetched successfully", {
        page,
        limit,
        count: data.length,
        data,
      })
    );
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

/**
 * 2. TOP RESTAURANTS BY REVENUE
 */
const getTopRestaurantsRevenue = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $match: { paymentStatus: "success" } },
      {
        $group: {
          _id: "$restaurantId",
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },
      {
        $project: {
          _id: 0,
          restaurantId: "$_id",
          restaurantName: "$restaurant.name",
          totalRevenue: 1,
          totalOrders: 1,
        },
      },
    ]);

    if (!data || data.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No records found", []));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        "Top restaurants by revenue fetched successfully",
        data
      )
    );
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

/**
 * 3. MOST ORDERED ITEMS
 */
const mostOrderedItemsController = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $match: { paymentStatus: "success" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItemId",
          totalOrdered: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "menuitems",
          localField: "_id",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      {
        $project: {
          _id: 0,
          menuItemId: "$_id",
          name: "$item.name",
          price: "$item.price",
          totalOrdered: 1,
        },
      },
    ]);

    if (!data || data.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No records found", []));
    }

    return res.status(200).json(
      new ApiResponse(200, "Most ordered items fetched successfully", data)
    );
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

/**
 * 4. MONTHLY TRENDS
 */
const monthlyTrendsController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, "startDate and endDate are required");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      throw new ApiError(400, "Invalid date format");
    }

    if (end < start) {
      throw new ApiError(400, "End date must be greater than start date");
    }

    const data = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["success", "pending"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    if (!data || data.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No records found", []));
    }

    return res.status(200).json(
      new ApiResponse(200, "Monthly trends fetched successfully", data)
    );
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, err.message));
  }
};

module.exports = {
  revenueController,
  getTopRestaurantsRevenue,
  mostOrderedItemsController,
  monthlyTrendsController,
};
