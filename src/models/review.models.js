import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: String,
      min: 1,
      max: 5,
      required: [true, "Please provide rating"],
    },

    comment: {
      type: String,
      required: [true, "Please provide review text"],
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

// User can leave only one review for a product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Average rating
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 },
      },
    },
    //console.log(result) // {_id: null, averageRating: 4, numOfReviews: 2}
  ]);

  try {
    await this.model("Product").findOneAndUpdate(
      { _id: productId },
      {
        // 👇 This is optional chaining in JavaScript
        averageRating: Math.ceil(result[0]?.averageRating || 0),
        numOfReviews: result[0]?.numOfReviews || 0,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

reviewSchema.post("save", async function () {
  await this.constructor.calculateAverageRating(this.product);
});
reviewSchema.post("remove", async function () {
  await this.constructor.calculateAverageRating(this.product);
});

export const Review = mongoose.model("Review", reviewSchema);
