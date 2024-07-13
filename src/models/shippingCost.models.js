import mongoose, { Schema } from "mongoose";

const citySchema = new Schema({
  name: { type: String, required: true },
  shippingCost: { type: Number, required: true },
});

export const City = mongoose.model("City", citySchema);
