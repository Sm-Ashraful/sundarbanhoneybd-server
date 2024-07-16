import mongoose, { Schema, version } from "mongoose";
import jwt from "jsonwebtoken";

import { AvailableUserRoles, UserRolesEnum } from "../constants.js";
import { Profile } from "./profile.models.js";
import { Cart } from "./cart.models.js";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      lowercase: true,
      trim: true,
    },
    tokenVersion: {
      type: Number,
      default: 1,
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.USER,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
    },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export const Client = mongoose.model("Client", clientSchema);
