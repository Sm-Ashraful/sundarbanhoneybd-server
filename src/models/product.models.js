import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
  {
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
    name: {
      required: true,
      type: String,
    },
    slug: {
      type: String,
    },
    owner: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    price: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      default: 0,
      type: Number,
    },
    subImages: {
      type: [
        {
          url: String,
        },
      ],
      default: [],
    },
    productType: {
      type: String,
      enum: ["regular", "special", "offer"],
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    productRating: {
      type: Number,
      default: 0,
    },
    details: {
      type: String,
    },
    shipping: {
      type: String,
      enum: ["FIXED", "NO", "EXP"],
    },
  },
  { timestamps: true }
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
