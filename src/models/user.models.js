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

const RESET_PASSWORD_TOKEN = {
  expiry: process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS,
};

const userSchema = new mongoose.Schema(
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
    email: {
      type: String,
      unique: String,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.USER,
      required: true,
    },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    password: {
      type: String,
      required: [true, "Please enter your password"],
    },
    refreshToken: {
      type: String,
    },
    loginType: {
      type: String,
      enum: AvailableSocialLogins,
      default: UserLoginType.EMAIL_PASSWORD,
    },
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.post("save", async function (user, next) {
  // ! Generally, querying data on every user save is not a good idea and not necessary when you are working on a specific application which has concrete models which are tightly coupled
  // ! However, in this application this user model is being referenced in many loosely coupled models so we need to do some initial setups before proceeding to make sure the data consistency and integrity
  const ecomProfile = await Profile.findOne({ owner: user._id });
  const cart = await Cart.findOne({ owner: user._id });

  // Setup necessary ecommerce models for the user
  if (!ecomProfile) {
    await Profile.create({
      owner: user._id,
      name: user.name,
      email: user?.email,
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

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
  next();
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      phone: this.phone,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPAIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
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

userSchema.methods.generateResetToken = async function () {
  const resetTokenValue = crypto.randomBytes(20).toString("base64url");
  const resetTokenSecret = crypto.randomBytes(10).toString("hex");
  const user = this;

  // Separator of `+` because generated base64url characters doesn't include this character
  const resetToken = `${resetTokenValue}+${resetTokenSecret}`;

  // Create a hash
  const resetTokenHash = crypto
    .createHmac("sha256", resetTokenSecret)
    .update(resetTokenValue)
    .digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordTokenExpiry =
    Date.now() + (RESET_PASSWORD_TOKEN.expiry || 5) * 60 * 1000; // Sets expiration age

  await user.save();

  return resetToken; 
};

export const User = mongoose.model("User", userSchema);
