import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createAt: {
      type: Date,
      default: Date.now,
      index: { expires: 600 },
    },
  },
  { timestamps: true }
);

export const OTP = mongoose.model("Otp", otpSchema);
