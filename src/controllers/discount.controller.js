import { Discount } from "../models/discount.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const validateDiscount = asyncHandler(async (req, res) => {
  try {
    const { discountCode } = req.body;

    if (!discountCode) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Discount code is required"));
    }

    const discount = await Discount.findOne({ code: discountCode });

    if (!discount || !discount.isActive) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Invalid or expired discount code"));
    }

    // Check if the discount code has expired
    if (discount.expiryDate && new Date() > discount.expiryDate) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Discount code has expired"));
    }

    return res.status(200).json(
      new ApiResponse(200, "Discount code is valid", {
        type: discount.type,
        value: discount.value,
      })
    );
  } catch (error) {
    console.error("Error validating discount code: ", error);
    return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
  }
});

export { validateDiscount };
