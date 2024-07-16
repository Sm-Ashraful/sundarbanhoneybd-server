import { City } from "../models/shippingCost.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createShippingCost = asyncHandler(async (req, res) => {
  const { name, shippingCost } = req.body;

  if (!name && !shippingCost) {
    throw new ApiError(
      400,
      "You must have to enter the city name and shipping cost"
    );
  }

  const existingCity = await City.findOne({ name });
  if (existingCity) {
    throw new ApiError(400, "A city with this name already exists");
  }

  const city = new City({ name, shippingCost });
  await city.save();

  res.status(201).json(new ApiResponse(201, "Shipping cost city is saved"));
});

const getCities = async (req, res) => {
  try {
    const cities = await City.find();
    return res
      .status(200)
      .json(new ApiResponse(200, "Cities fetched successfully", cities));
  } catch (error) {
    console.error("Error fetching cities: ", error);
    return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
  }
};

export { getCities, createShippingCost };
