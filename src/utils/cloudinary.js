import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFile) => {
  try {
    if (!localFile) return null;
    const res = await cloudinary.uploader.upload(localFile, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFile); //remove the locally file after uploaded to cloudinary
    return res;
  } catch (error) {
    fs.unlinkSync(localFile); //remove the locally file if it is not uploaded to cloudinary
    return null;
  }
};

export { uploadOnCloudinary };
