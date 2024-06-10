import mongoose, { Schema } from "mongoose";

const discountSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Discount = mongoose.model("Discount", discountSchema);
