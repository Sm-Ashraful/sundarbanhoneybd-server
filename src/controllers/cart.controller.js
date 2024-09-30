import { Cart } from "../models/cart.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.models.js";

/**
 *
 * @param {string} userId
 * @description A utility function, which querys the {@link Cart} model and returns the cart in `Promise<{_id: string, items: {_id: string, product: Product, quantity: number}[], cartTotal: number}>` format
 *  @returns {Promise<{_id: string, items: {_id: string, product: Product, quantity: number}[], cartTotal: number, discountedTotal: number, coupon: Coupon}>}
 */

const getCart = async (userId) => {
  const cartAggregation = await Cart.aggregate([
    {
      $match: {
        owner: userId,
      },
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $project: {
        // _id: 0,
        product: { $first: "$product" },
        quantity: "$items.quantity",
        coupon: 1, // also project coupon field
      },
    },
    {
      $group: {
        _id: "$_id",
        items: {
          $push: "$$ROOT",
        },
        coupon: { $first: "$coupon" }, // get first value of coupon after grouping
        cartTotal: {
          $sum: {
            $multiply: ["$product.price", "$quantity"], // calculate the cart total based on product price * total quantity
          },
        },
      },
    },
    {
      $lookup: {
        // lookup for the coupon
        from: "coupons",
        localField: "coupon",
        foreignField: "_id",
        as: "coupon",
      },
    },
    {
      $addFields: {
        // As lookup returns an array we access the first item in the lookup array
        coupon: { $first: "$coupon" },
      },
    },
    {
      $addFields: {
        discountedTotal: {
          // Final total is the total we get once user applies any coupon
          // final total is total cart value - coupon's discount value
          $ifNull: [
            {
              $subtract: ["$cartTotal", "$coupon.discountValue"],
            },
            "$cartTotal", // if there is no coupon applied we will set cart total as out final total
            ,
          ],
        },
      },
    },
  ]);
  return (
    cartAggregation[0] ?? {
      _id: null,
      items: [],
      cartTotal: 0,
      discountedTotal: 0,
    }
  );
};

const getClientCart = asyncHandler(async (req, res) => {
  let cart = await getCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart fetched successfully"));
});

const addItemOrUpdateItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;
  const user = req.user;
  try {
    if (!user) {
      throw new ApiError(400, "User is unauthorize");
    }

    let userCart = await Cart.findOne({ owner: user._id });
    if (!userCart) {
      userCart = new Cart({ owner: user._id });
    }
    // See if product that user is adding exist in the db
    const product = await Product.findById(productId);

    if (!product) throw new ApiError(404, "Product does not exists");

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
      if (userCart.coupon) {
        userCart.coupon = null;
      }
    } else {
      userCart.owner = user._id;
      userCart.items.push({
        productId,
        quantity,
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
      // const newCart = await getCart(req.user._id);
      // console.log("New cart: ", newCart);
      return res
        .status(200)
        .json(new ApiResponse(200, "Item added successfully"));
    }
  } catch (error) {
    console.log("Error: ", error);
    throw new ApiError(499, "something went wrong");
  }

  await userCart.save({ validateBeforeSave: true });
  const newCart = await getCart(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, newCart, "Item added successfully"));
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
      // Pull the product inside the cart items
      // ! We are not handling decrement logic here that's we are doing in addItemOrUpdateItemQuantity method
      // ! this controller is responsible to remove the cart item entirely
      $pull: {
        items: {
          productId: productId,
        },
      },
    },
    { new: true }
  );

  let cart = await getCart(req.user._id);

  // check if the cart's new total is greater than the minimum cart total requirement of the coupon
  if (cart.coupon && cart.cartTotal < cart.coupon.minimumCartValue) {
    // if it is less than minimum cart value remove the coupon code which is applied
    updatedCart.coupon = null;
    await updatedCart.save({ validateBeforeSave: false });
    // fetch the latest updated cart
    cart = await getCart(req.user._id);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Cart item removed successfully", cart));
});

const clearCart = asyncHandler(async (req, res) => {
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

export {
  getCart,
  getClientCart,
  addItemOrUpdateItemQuantity,
  removeItemFromCart,
  clearCart,
};
