import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const addressSchema = new Schema(
  {
    addressLine1: {
      required: true,
      type: String,
    },
    addressLine2: {
      type: String,
    },
    district: {
      required: true,
      type: String,
    },
    owner: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    postcode: {
      required: true,
      type: String,
    },
    state: {
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

addressSchema.plugin(mongooseAggregatePaginate);

export const Address = mongoose.model("Address", addressSchema);
