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
    bannerImage: {
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
    weight: {
      default: 0,
      type: Number,
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
    offerTimePeriod: {
      type: Number,
    },
    offerTitle: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
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

// productSchema.virtual("reviews", {
//   ref: "Review",
//   localField: "_id",
//   foreignField: "product",
//   justOne: false,
//   // match: {rating: 5} // Get the reviews whose rating is only 5.
// });

// productSchema.pre("remove", async function (next) {
//   // Go to 'Reveiw; and delete all the review that are associated with this particular product
//   await this.model("Review").deleteMany({ product: this._id });
// });

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
