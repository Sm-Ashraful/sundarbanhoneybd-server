import { Cart } from "../models/cart.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addItemOrUpdateItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const { user } = req.user;

  if (!user) {
    throw new ApiError(400, "User is not authorize");
  }
  let cart = await Cart.find({ owner: req.user._id });
  if (!cart) {
    cart = new Cart({ owner: req.user._id });
  }
  console.log("Cart: ", cart);
});

export { addItemOrUpdateItemQuantity };
