const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const ApiResponse = require("../utlis/ApiResponse");

const getDashboardOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalUsers,
      totalRestaurants,
      totalMenuItems,
      totalOrders,
      activeOrders,
      totalPayments,
      recentOrders,
      recentPayments,
      currentMonthOrders,
      previousMonthOrders,
      revenueStats,
      orderStatusBreakdown,
      paymentStatusBreakdown,
      topRestaurants,
      topItems,
      monthlyTrendRaw,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Restaurant.countDocuments(),
      MenuItem.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ["placed", "preparing"] } }),
      Payment.countDocuments(),
      Order.find()
        .populate("userId", "name email")
        .populate("restaurantId", "name")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Payment.find()
        .populate({
          path: "orderId",
          select: "totalAmount status",
          populate: { path: "restaurantId", select: "name" },
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Order.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      Order.countDocuments({
        createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
      }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "success"] }, "$totalAmount", 0],
              },
            },
            successfulOrders: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "success"] }, 1, 0],
              },
            },
            pendingPayments: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0],
              },
            },
            failedPayments: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
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
      ]),
      Order.aggregate([
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
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: trendStart },
            paymentStatus: { $in: ["success", "pending", "failed"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "success"] }, "$totalAmount", 0],
              },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const revenueMeta = revenueStats[0] || {
      totalRevenue: 0,
      successfulOrders: 0,
      pendingPayments: 0,
      failedPayments: 0,
    };

    const averageOrderValue = revenueMeta.successfulOrders
      ? revenueMeta.totalRevenue / revenueMeta.successfulOrders
      : 0;

    const monthGrowth = previousMonthOrders
      ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100
      : currentMonthOrders > 0
        ? 100
        : 0;

    const monthlyTrend = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const matched = monthlyTrendRaw.find(
        (item) => item._id.month === month && item._id.year === year
      );

      monthlyTrend.push({
        label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        totalOrders: matched?.totalOrders || 0,
        totalRevenue: matched?.totalRevenue || 0,
      });
    }

    return res.json(
      new ApiResponse(200, "Admin dashboard overview fetched", {
        summary: {
          totalUsers,
          totalRestaurants,
          totalMenuItems,
          totalOrders,
          activeOrders,
          totalPayments,
          totalRevenue: revenueMeta.totalRevenue,
          successfulOrders: revenueMeta.successfulOrders,
          pendingPayments: revenueMeta.pendingPayments,
          failedPayments: revenueMeta.failedPayments,
          averageOrderValue: Number(averageOrderValue.toFixed(2)),
          monthGrowth: Number(monthGrowth.toFixed(2)),
        },
        trends: monthlyTrend,
        orderStatusBreakdown,
        paymentStatusBreakdown,
        topRestaurants,
        topItems,
        recentOrders,
        recentPayments,
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardOverview };
