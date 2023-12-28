import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "root"],
      default: "user",
    },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    password: {
      type: String,
      required: [true, "Please enter your password"],
    },
    refreshToken: {
      type: String,
    },
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
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
  next();
};

userSchema.methods.generateAccessToken = function () {
  jwt.sign(
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
  jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPAIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
