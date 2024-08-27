import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity can not be less then 1."],
    default: 1,
  },
});

const cartSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    items: {
      type: [itemSchema],
      default: [], // Set default value for items array directly here
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },

  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
