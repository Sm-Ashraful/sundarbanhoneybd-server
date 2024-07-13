import { Checkout } from "../models/checkout.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const checkoutItems = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;
  const user = req.user;

  try {
    if (!user) {
      throw new ApiError(400, "User is unauthorize");
    }

    let userCheckout = await Checkout.findOne({ owner: user._id });
    if (!userCheckout) {
      userCheckout = new Checkout({ owner: user._id });
    }
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(500, "Product does not exists");

    userCheckout.items.push({
      productId,
      quantity,
    });

    await userCheckout.save();

    return res.status(200).json(new ApiResponse(200, "Checkout items added"));
  } catch (error) {
    console.log("Error: ", error);
    throw new ApiError(400, error);
  }
});

const getUserCheckout = asyncHandler(async (req, res) => {
  let checkoutItem = await Checkout.findOne({ owner: req.user._id }).populate({
    path: "items.productId", // Populate the productId field in items
    select: "name mainImage price", // Select only the name and image fields from the Product model
  });
  if (!checkoutItem) {
    throw new ApiError(400, "There is no checkout items for this user!");
  }
  let totalPrice = 0;
  checkoutItem.items.forEach((item) => {
    totalPrice += item.productId.price * item.quantity;
  });

  let shippingCost = 150;
  let finalTotalPrice = totalPrice + shippingCost;

  let response = {
    items: checkoutItem.items,
    totalPrice: totalPrice,
    finalTotalPrice: finalTotalPrice,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Checkout Items fetched successfully", response)
    );
});

const clearCheckout = asyncHandler(async (req, res) => {
  await Checkout.findOneAndUpdate(
    {
      owner: req.user._id,
    },
    {
      $set: {
        items: [],
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Checkout item has been cleared"));
});

export { checkoutItems, getUserCheckout, clearCheckout };
