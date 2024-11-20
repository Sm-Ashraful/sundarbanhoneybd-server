import crypto from "crypto";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { Order } from "../models/order.models.js";
import { Cart } from "../models/cart.models.js";
import { getCart } from "./cart.controller.js";
import { Product } from "../models/product.models.js";
import { orderConfirmationMailgenContent } from "../utils/mail.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Client } from "../models/auth.models.js";
import { Address } from "../models/address.models.js";

const createOrder = asyncHandler(async (req, res) => {
  const method = req.query.method;
  const customerData = req.body;

  if (method === "cash") {
    const deliveryAddress = customerData.deliveryAddress;
    const items = customerData.items;
    const totalPrice = customerData.totalPrice;
    const shippingPrice = customerData.shippingPrice;

    try {
      const orderItems = [];
      const customer = await Client.findById(req.user?._id);

      if (!customer) {
        throw new ApiError(404, "Customer not found");
      }

      const savedAddress = await Address.create({
        ...deliveryAddress, // Spread the address details from `customerData.deliveryAddress`
        owner: req.user?._id, // Associate with the customer
      });

      for (const item of items) {
        const product = await Product.findById(item.product._id);
        if (!product) {
          throw new ApiError(
            404,
            `Product with ID ${item.product._id} not found`
          );
        }
        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: product.price, // Assuming `price` is a field in the Product model
        });
      }
      // Create and save order
      const newOrder = new Order({
        orderPrice: totalPrice,
        shippingPrice,
        customer: req.user?._id,
        items: orderItems,
        address: savedAddress._id,
        status: "PENDING",
        paymentProvider: "CASH",
        isPaymentDone: false,
      });

      const savedOrder = await newOrder.save({ validateBeforeSave: false });

      let bulkStockUpdates = items.map((item) => {
        // Reduce the products stock
        return {
          updateOne: {
            filter: { _id: item.product?._id },
            update: { $inc: { stock: -item.quantity } }, // subtract the item quantity
          },
        };
      });

      const product = await Product.bulkWrite(bulkStockUpdates, {
        skipValidation: true,
      });

      console.log("Save.", product);

      return res
        .status(200)
        .json(new ApiResponse(200, "Order fetched successfully", savedOrder));
    } catch (error) {
      throw new ApiError(500, "Error creating order", error);
    }
  }
});

const getOrdersByCustomerId = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user._id;
    if (!customerId) {
      throw new ApiError(404, "Customer not found!");
    }
    const { status } = req.query;
    // Build the match condition
    const matchCondition = {
      customer: new mongoose.Types.ObjectId(customerId),
    };
    if (status) {
      matchCondition.status = status.toUpperCase();
    }

    // Fetch orders with specific product details
    const orders = await Order.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "products", // The Product collection
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails", // Temporary field for lookup
          pipeline: [
            {
              $project: {
                slug: 1,
                name: 1,
                price: 1,
                mainImage: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "addresses", // Correct collection name
          localField: "address",
          foreignField: "_id",
          as: "addressDetails", // Temporary field for address lookup
          pipeline: [
            {
              $project: {
                customer: 1,
                address: 1,
                city: 1,
                policeStation: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
          address: { $arrayElemAt: ["$addressDetails", 0] }, // Extract the first address object
        },
      },
      {
        $project: {
          "items.product._id": 0, // Exclude unnecessary fields
          addressDetails: 0, // Exclude the temporary address lookup field
          productDetails: 0, // Exclude the temporary product lookup field
        },
      },
    ]);

    console.log("Order items: ", orders);

    if (orders.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, "No orders available!", []));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Orders fetched successfully!", orders));
  } catch (error) {
    console.log("Error for getting orders: ", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "Internal server error!", []));
  }
});

/**
 *
 * @param {string} orderPaymentId
 * @param {import("express").Request} req
 * @description Utility function which is responsible for:
 * * Marking order payment done flag to true
 * * Clearing up the cart
 * * Calculate product's remaining stock
 * * Send mail to the user about order confirmation
 */
const orderFulfillmentHelper = async (orderPaymentId, req) => {
  const order = await Order.findOneAndUpdate(
    {
      paymentId: orderPaymentId,
    },
    {
      $set: {
        isPaymentDone: true,
      },
    },
    { new: true }
  );

  if (!order) {
    throw new ApiError(404, "Order does not exist");
  }

  // Get the user's card
  const cart = await Cart.findOne({
    owner: req.user._id,
  });

  const userCart = await getCart(req.user._id);

  // Logic to handle product's stock change once order is placed
  let bulkStockUpdates = userCart.items.map((item) => {
    // Reduce the products stock
    return {
      updateOne: {
        filter: { _id: item.product?._id },
        update: { $inc: { stock: -item.quantity } }, // subtract the item quantity
      },
    };
  });

  // * (bulkWrite()) is faster than sending multiple independent operations (e.g. if you use create())
  // * because with bulkWrite() there is only one network round trip to the MongoDB server.
  await Product.bulkWrite(bulkStockUpdates, {
    skipValidation: true,
  });

  await sendEmail({
    email: req.user?.email,
    subject: "Order confirmed",
    mailgenContent: orderConfirmationMailgenContent(
      req.user?.username,
      userCart.items,
      order.discountedOrderPrice ?? 0 // send discounted price in the mail which is paid by the user
    ),
  });

  cart.items = []; // empty the cart
  // remove the associated coupon

  await cart.save({ validateBeforeSave: false });
  return order;
};

/**
 *
 * @param {string} endpoint
 * @param {any} body
 * @description utility function responsible for making paypal api calls for order generation and payment verification
 */
// const paypalApi = async (endpoint, body = {}) => {
//   const accessToken = await generatePaypalAccessToken();
//   return await fetch(`${paypalBaseUrl.sandbox}/v2/checkout/orders${endpoint}`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//     },
//     body: JSON.stringify(body),
//   });
// };

// let razorpayInstance;

// try {
//   razorpayInstance = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
//   });
// } catch (error) {
//   console.error("RAZORPAY ERROR: ", error);
// }

// * CONTROLLERS

// const generateRazorpayOrder = asyncHandler(async (req, res) => {
//   const { addressId } = req.body;

//   if (!razorpayInstance) {
//     console.error("RAZORPAY ERROR: `key_id` is mandatory");
//     throw new ApiError(500, "Internal server error");
//   }

//   // Check if address is valid and is of logged in user's
//   const address = await Address.findOne({
//     _id: addressId,
//     owner: req.user._id,
//   });

//   if (!address) {
//     throw new ApiError(404, "Address does not exists");
//   }

//   const cart = await Cart.findOne({
//     owner: req.user._id,
//   });

//   if (!cart || !cart.items?.length) {
//     throw new ApiError(400, "User cart is empty");
//   }
//   const orderItems = cart.items;
//   const userCart = await getCart(req.user._id);

//   // note down th total cart value and cart value after the discount
//   // If no coupon is applied the total and discounted prices will be the same
//   const totalPrice = userCart.cartTotal;
//   const totalDiscountedPrice = userCart.discountedTotal;

//   const orderOptions = {
//     amount: parseInt(totalDiscountedPrice) * 100, // in paisa
//     currency: "INR", // Might accept from client
//     receipt: nanoid(10),
//   };

//   razorpayInstance.orders.create(
//     orderOptions,
//     async function (err, razorpayOrder) {
//       if (!razorpayOrder || (err && err.error)) {
//         // Throwing ApiError here will not trigger the error handler middleware
//         return res
//           .status(err.statusCode)
//           .json(
//             new ApiResponse(
//               err.statusCode,
//               null,
//               err.error.reason ||
//                 "Something went wrong while initialising the razorpay order."
//             )
//           );
//       }

//       // Create an order while we generate razorpay session
//       // In case payment is done and there is some network issue in the payment verification api
//       // We will at least have a record of the order
//       const unpaidOrder = await EcomOrder.create({
//         address: addressId,
//         customer: req.user._id,
//         items: orderItems,
//         orderPrice: totalPrice ?? 0,
//         discountedOrderPrice: totalDiscountedPrice ?? 0,
//         paymentProvider: PaymentProviderEnum.RAZORPAY,
//         paymentId: razorpayOrder.id,
//         coupon: userCart.coupon?._id,
//       });
//       if (unpaidOrder) {
//         // if order is created then only proceed with the payment
//         return res
//           .status(200)
//           .json(
//             new ApiResponse(200, razorpayOrder, "Razorpay order generated")
//           );
//       } else {
//         return res
//           .status(500)
//           .json(
//             new ApiResponse(
//               500,
//               null,
//               "Something went wrong while initialising the razorpay order."
//             )
//           );
//       }
//     }
//   );
// });

// const verifyRazorpayPayment = asyncHandler(async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     req.body;

//   let body = razorpay_order_id + "|" + razorpay_payment_id;

//   let expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(body.toString())
//     .digest("hex");

//   if (expectedSignature === razorpay_signature) {
//     const order = await orderFulfillmentHelper(razorpay_order_id, req);
//     return res
//       .status(201)
//       .json(new ApiResponse(201, order, "Order placed successfully"));
//   } else {
//     throw new ApiError(400, "Invalid razorpay signature");
//   }
// });

// const generatePaypalOrder = asyncHandler(async (req, res) => {
//   const { addressId } = req.body;

//   // Check if address is valid and is of logged in user's
//   const address = await Address.findOne({
//     _id: addressId,
//     owner: req.user._id,
//   });

//   if (!address) {
//     throw new ApiError(404, "Address does not exists");
//   }

//   const cart = await Cart.findOne({
//     owner: req.user._id,
//   });

//   if (!cart || !cart.items?.length) {
//     throw new ApiError(400, "User cart is empty");
//   }
//   const orderItems = cart.items; // these items are used further to set product stock
//   const userCart = await getCart(req.user._id);

//   // note down th total cart value and cart value after the discount
//   // If no coupon is applied the total and discounted prices will be the same
//   const totalPrice = userCart.cartTotal;
//   const totalDiscountedPrice = userCart.discountedTotal;

//   const response = await paypalApi("/", {
//     intent: "CAPTURE",
//     purchase_units: [
//       {
//         amount: {
//           currency_code: "USD",
//           value: (totalDiscountedPrice * 0.012).toFixed(0), // convert indian rupees to dollars
//         },
//       },
//     ],
//   });

//   const paypalOrder = await response.json();

//   if (paypalOrder?.id) {
//     // Create an order while we generate paypal session
//     // In case payment is done and there is some network issue in the payment verification api
//     // We will at least have a record of the order
//     const unpaidOrder = await EcomOrder.create({
//       address: addressId,
//       customer: req.user._id,
//       items: orderItems,
//       orderPrice: totalPrice ?? 0,
//       discountedOrderPrice: totalDiscountedPrice ?? 0,
//       paymentProvider: PaymentProviderEnum.PAYPAL,
//       paymentId: paypalOrder.id,
//       coupon: userCart.coupon?._id,
//     });
//     if (unpaidOrder) {
//       // if order is created then only proceed with the payment
//       return res
//         .status(201)
//         .json(
//           new ApiResponse(
//             201,
//             paypalOrder,
//             "Paypal order generated successfully"
//           )
//         );
//     }
//   }
//   // if there is no paypal order or unpaidOrder created throw an error
//   console.log(
//     "Make sure you have provided your PAYPAL credentials in the .env file"
//   );
//   throw new ApiError(
//     500,
//     "Something went wrong while initialising the paypal order."
//   );
// });

// const verifyPaypalPayment = asyncHandler(async (req, res) => {
//   const { orderId } = req.body;

//   const response = await paypalApi(`/${orderId}/capture`, {});
//   const capturedData = await response.json();

//   if (capturedData?.status === "COMPLETED") {
//     const order = await orderFulfillmentHelper(capturedData.id, req);

//     return res
//       .status(200)
//       .json(new ApiResponse(200, order, "Order placed successfully"));
//   } else {
//     throw new ApiError(500, "Something went wrong with the paypal payment");
//   }
// });

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  let order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order does not exist");
  }

  if (order.status === OrderStatusEnum.DELIVERED) {
    throw new ApiError(400, "Order is already delivered");
  }

  order = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        status,
      },
    },
    { new: true }
  );
  return res.status(200).json(
    new ApiResponse(
      200,

      "Order status changed successfully",
      {
        status,
      }
    )
  );
});

const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(orderId),
      },
    },
    // lookup for an address associated with the order
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
    // lookup for a coupon applied while placing the order

    // lookup returns array so get the first element of address and customer
    {
      $addFields: {
        customer: { $first: "$customer" },
        address: { $first: "$address" },
      },
    },
    // Now we have array of order items with productId being the id of the product that is being ordered
    // So we want to send complete details of that product

    // To do so we first unwind the items array
    { $unwind: "$items" },

    // it gives us documents with `items` being an object with ket {_id, productId, quantity}
    {
      // lookup for a product associated
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "items.product", // store that looked up product in items.product key
      },
    },
    // As we know lookup will return an array
    // we want product key to be an object not array
    // So, once lookup is done we access first item in an array
    { $addFields: { "items.product": { $first: "$items.product" } } },
    // As we have unwind the items array the output of the following stages is not desired one
    // So to make it desired we need to group whatever we have unwinded
    {
      $group: {
        // we group the documents with `_id (which is an order id)`
        // The reason being, each order is unique and main entity of this api
        _id: "$_id",
        order: { $first: "$$ROOT" }, // we also assign whole root object to be the order
        // we create a new key orderItems in which we will push each order item (product details and quantity) with complete product details
        orderItems: {
          $push: {
            _id: "$items._id",
            quantity: "$items.quantity",
            product: "$items.product",
          },
        },
      },
    },
    {
      $addFields: {
        // now we will create a new items key in the order object and assign the orderItems value to it to keep everything in the `order` key
        "order.items": "$orderItems",
      },
    },
    {
      $project: {
        // ignore the orderItems key as we don't need it
        orderItems: 0,
      },
    },
  ]);

  if (!order[0]) {
    throw new ApiError(404, "Order does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Order fetched successfully", order[0]));
});

const getOrderListAdmin = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const orderAggregate = Order.aggregate([
    {
      $match:
        status && AvailableOrderStatuses.includes(status.toUpperCase())
          ? {
              status: status.toUpperCase(),
            }
          : {},
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

export {
  createOrder,
  getOrdersByCustomerId,
  getOrderById,
  getOrderListAdmin,
  updateOrderStatus,
};
