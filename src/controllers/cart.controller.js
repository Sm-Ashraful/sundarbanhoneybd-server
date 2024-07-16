import { Cart } from "../models/cart.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.models.js";

const addItemOrUpdateItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;
  const user = req.user;

  if (!user) {
    throw new ApiError(400, "User is unauthorize");
  }

  let userCart = await Cart.findOne({ owner: user._id });
  if (!userCart) {
    userCart = new Cart({ owner: user._id });
  }

  const product = await Product.findById(productId); //shoud be optomize
  if (!product) throw new ApiError(500, "Product does not exists");
  if (quantity > product.stock) {
    // if quantity is greater throw an error
    throw new ApiError(
      400,
      product.stock > 0
        ? "Only " +
          product.stock +
          " products are remaining. But you are adding " +
          quantity
        : "Product is out of stock"
    );
  }
  const productThatAlreadyInCart = await userCart.items?.find((item) => {
    return item.productId.toString() === productId;
  });
  if (productThatAlreadyInCart) {
    productThatAlreadyInCart.quantity = quantity;
  } else {
    userCart.owner = user._id;
    userCart.items.push({
      productId,
      quantity,
    });
  }
  await userCart.save({ validateBeforeSave: true });
  const newCart = await getCart(req.user._id);
  return res.status(200).json(new ApiResponse(200, "Item added successfully"));
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  // check for product existence
  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  const updatedCart = await Cart.findOneAndUpdate(
    {
      owner: req.user._id,
    },
    {
      $pull: {
        items: {
          productId: productId,
        },
      },
    },
    { new: true }
  );

  await updatedCart.save({ validateBeforeSave: false });
  const cart = await getCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Cart item removed successfully", cart));
});

const clearCart = asyncHandler(async (req, res) => {
  console.log("Req.user: ", req.user);
  await Cart.findOneAndUpdate(
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
  const cart = await getCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Cart has been cleared", cart));
});

export { addItemOrUpdateItemQuantity, removeItemFromCart, clearCart };
