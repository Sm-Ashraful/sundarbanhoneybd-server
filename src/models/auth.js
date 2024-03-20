import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  AvailableSocialLogins,
  AvailableUserRoles,
  UserLoginType,
  UserRolesEnum,
} from "../constants.js";
import { Profile } from "./profile.models.js";
import { Cart } from "./cart.models.js";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.CLIENT,
      required: true,
    },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    otp: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    loginType: {
      type: String,
      enum: AvailableSocialLogins,
      default: UserLoginType.CLIENT,
    },
  },
  { timestamps: true }
);

clientSchema.post("save", async function (user, next) {
  // ! Generally, querying data on every user save is not a good idea and not necessary when you are working on a specific application which has concrete models which are tightly coupled
  // ! However, in this application this user model is being referenced in many loosely coupled models so we need to do some initial setups before proceeding to make sure the data consistency and integrity
  const ecomProfile = await Profile.findOne({ owner: user._id });
  const cart = await Cart.findOne({ owner: user._id });

  // Setup necessary ecommerce models for the user
  if (!ecomProfile) {
    await Profile.create({
      owner: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phone,
    });
  }
  if (!cart) {
    await Cart.create({
      owner: user._id,
      items: [],
    });
  }

  // Setup necessary social media models for the user
  // if (!socialProfile) {
  //   await SocialProfile.create({
  //     owner: user._id,
  //   });
  // }
  next();
});

clientSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      phone: this.phone,
      role: this.role,
      otp: this.otp,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPAIRY,
    }
  );
};
clientSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPAIRY,
    }
  );
};

export const Client = mongoose.model("Client", clientSchema);
