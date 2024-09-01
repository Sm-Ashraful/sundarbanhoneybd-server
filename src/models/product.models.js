import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
  {
    name: {
      required: true,
      type: String,
    },
    slug: {
      type: String,
    },
    category: {
      ref: "Category",
      required: true,
      type: Schema.Types.ObjectId,
    },
    description: {
      required: true,
      type: String,
    },
    mainImage: {
      required: true,
      type: {
        url: String,
      },
    },
    subImages: {
      type: [
        {
          url: String,
        },
      ],
      default: [],
    },
    price: {
      type: Number,
      default: 0,
    },

    weight: {
      default: 0,
      type: String,
    },
    element: {
      type: String,
    },
    stock: {
      default: 0,
      type: Number || String,
    },
    owner: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    rating: {
      type: Number,
      default: 0,
    },

    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    details: {
      type: String,
    },
    shippingStatus: {
      type: String,
      enum: ["NO", "REGULAR", "FIXED"],
      default: "REGULAR",
    },

    status: {
      type: String,
      enum: ["pending", "complete", "remove"],
      default: "pending",
      required: true,
    },
    //for offer product
    bannerImage: {
      type: {
        url: String,
      },
    },
    offerTimePeriod: {
      type: Number,
    },
    offerTitle: {
      type: String,
    },
    offerBannerTitle: {
      type: String,
    },
    discount: {
      type: Number,
    },
    type: {
      type: String,
      enum: ["REGULAR", "OFFER", "SPECIAL", "DEALSOFTHEDAY"],
      default: "REGULAR",
    },
  },
  { timestamps: true }
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
