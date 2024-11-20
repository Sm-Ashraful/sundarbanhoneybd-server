import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const addressSchema = new Schema(
  {
    customer: {
      required: true,
      type: String,
    },
    address: {
      required: true,
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
  },
  { timestamps: true }
);

addressSchema.plugin(mongooseAggregatePaginate);

export const Address = mongoose.model("Address", addressSchema);
