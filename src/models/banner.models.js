import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subTitle: {
      type: String,
      lowercase: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    bannerImage: {
      type: String,
      required: true,
    },
    linkType: {
      type: String,
      enum: ["shop", "product", "category", "none"], // Restrict to specific values
      required: true,
      default: "none",
    },
    shopLink: {
      type: String,
      required: function () {
        return this.linkType === "shop";
      },
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.linkType === "product";
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: function () {
        return this.linkType === "category";
      },
    },
    status: {
      type: String,
      enum: ["pending", "complete", "remove"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: true }
);

export const Banner = mongoose.model("Banner", bannerSchema);
