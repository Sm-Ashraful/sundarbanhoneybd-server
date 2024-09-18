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
    policeStation: {
      required: true,
      type: String,
    },
    city: {
      type: String,
    },
    owner: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    postcode: {
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
