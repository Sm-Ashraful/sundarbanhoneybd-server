import mongoose, { Schema } from "mongoose";
import { Client } from "./auth.models.js";
import { AvailableCouponTypes, CouponTypeEnum } from "../constants.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const couponSchema = new Schema(
  {
    name: {
      type: String,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: AvailableCouponTypes,
      required: CouponTypeEnum.FLAT,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minimumCartValue: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Client",
    },
  },
  { timestamps: true }
);

couponSchema.plugin(mongooseAggregatePaginate);

export const Coupon = mongoose.model("Coupon", couponSchema);
