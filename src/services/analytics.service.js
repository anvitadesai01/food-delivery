const Order = require("../models/order.model");

const getRevenue = async (page = 1, limit = 10) => {

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) {
        page = 1;
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
        limit = 10;
    }

    const skip = (page - 1) * limit;

    const data = await Order.aggregate([
        {
            $match: { paymentStatus: "success" },
        },
        {
            $group: {
                _id: "$restaurantId",
                totalRevenue: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 },
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
        {
            $unwind: "$restaurant",
        },
        {
            $project: {
                _id: 0,
                restaurantId: "$_id",
                restaurantName: "$restaurant.name",
                totalRevenue: 1,
                totalOrders: 1,
            },
        },
        {
            $sort: { totalRevenue: -1 },
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
    ]);

    return {
        page,
        limit,
        count: data.length,
        data,
    };
};


const getTopRestaurantsByRevenue = async () => {
    return await Order.aggregate([
        {
            $match: { paymentStatus: "success" },
        },
        {
            $group: {
                _id: "$restaurantId",
                totalRevenue: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 },
            },
        },
        {
            $sort: { totalRevenue: -1 },
        },
        {
            $limit: 5,
        },
        {
            $lookup: {
                from: "restaurants",
                localField: "_id",
                foreignField: "_id",
                as: "restaurant",
            },
        },
        {
            $unwind: "$restaurant",
        },
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
};

const getMostOrderedItems = async () => {
    return await Order.aggregate([
        {
            $match: { paymentStatus: "success" },
        },
        {
            $unwind: "$items",
        },
        {
            $group: {
                _id: "$items.menuItemId",
                totalOrdered: { $sum: "$items.quantity" },
            },
        },
        {
            $sort: { totalOrdered: -1 },
        },
        {
            $limit: 5, // top 5
        },
        {
            $lookup: {
                from: "menuitems",
                localField: "_id",
                foreignField: "_id",
                as: "item",
            },
        },
        {
            $unwind: "$item",
        },
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
};

const getMonthlyTrends = async (startDate, endDate) => {

    const matchStage = {
        paymentStatus: { $in: ["success", "pending"] },
    };

    if (startDate && endDate) {
        matchStage.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }

    return await Order.aggregate([
        { $match: matchStage },
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
};



module.exports = { getRevenue, getTopRestaurantsByRevenue, getMostOrderedItems, getMonthlyTrends };