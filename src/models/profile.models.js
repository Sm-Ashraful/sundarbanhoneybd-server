import mongoose, { Schema } from "mongoose";

const profileSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      default: "",
    },
    countryCode: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
