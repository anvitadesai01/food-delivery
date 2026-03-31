const {
    getRevenue,
    getTopRestaurantsByRevenue,
    getMostOrderedItems,
    getMonthlyTrends
} = require("../services/analytics.service");

const ApiResponse = require("../utlis/ApiResponse");
const ApiError = require("../utlis/ApiError");

//  1. Revenue Controller
const revenueController = async (req, res, next) => {
    try {
        const page = req.query.page;
        const limit = req.query.limit;

        const data = await getRevenue(page,limit);

        if (!data || data.length === 0) {
            throw new ApiError(404, "No Records Found")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Revenue fetched successfully", data));
    } catch (err) {
        next(new ApiError(500, err.message));
    }
};

//  2. Top Restaurants by Revenue
const getTopRestaurantsRevenue = async (req, res, next) => {
    try {
        const data = await getTopRestaurantsByRevenue();

        if (!data || data.length === 0) {
            throw new ApiError(404, "No Records Found")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Top restaurants by revenue fetched successfully",
                    data
                )
            );
    } catch (err) {
        next(new ApiError(500, err.message));
    }
};

//  3. Most Ordered Items
const mostOrderedItemsController = async (req, res, next) => {
    try {
        const data = await getMostOrderedItems();

        if (!data || data.length === 0) {
            throw new ApiError(404, "No Records Found")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Most ordered items fetched successfully",
                    data
                )
            );
    } catch (err) {
        next(new ApiError(500, err.message));
    }
};

//  4. Monthly Trends
const monthlyTrendsController = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            throw new ApiError(400, "startDate and endDate are required");
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            throw new ApiError(400, "End date must be greater than start date");
        }

        const data = await getMonthlyTrends(start, end);

        if (!data || data.length === 0) {
            throw new ApiError(404, "No Records Found")
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
    monthlyTrendsController
};