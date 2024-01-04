import { Order } from "../models/order.models.js";
import { Profile } from "../models/profile.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";

const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await Profile.findOne({
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "User profile fetched successfully", profile));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phoneNumber, countryCode } = req.body;
  const profile = await Profile.findOneAndUpdate(
    {
      owner: req.user._id,
    },
    {
      $set: {
        name,
        phoneNumber,
        countryCode,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "User profile updated successfully", profile));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const orderAggregate = Order.aggregate([
    {
      // Get orders associated with the user
      $match: {
        customer: req.user._id,
      },
    },
    {
      $lookup: {
        from: "addresses",
        localField: "address",
        foreignField: "_id",
        as: "address",
      },
    },
    // lookup for a customer associated with the order
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        customer: { $first: "$customer" },
        address: { $first: "$address" },
        totalOrderItems: { $size: "$items" },
      },
    },
    {
      $project: {
        items: 0,
      },
    },
  ]);

  const orders = await Order.aggregatePaginate(
    orderAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalOrders",
        docs: "orders",
      },
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Orders fetched successfully", orders));
});

export { getMyProfile, updateProfile, getMyOrders };
