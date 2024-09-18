import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { getPublicIdFromUrl } from "./helpers.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// cloudinary.config({
//   cloud_name: "dwbxkls2q",
//   api_key: "927618442774741",
//   api_secret: "VttrV5FpbYl0hgdhckFdfkf8Ung",
// });

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

const deleteFromCloudinary = async (imageUrl) => {
  const publicId = getPublicIdFromUrl(imageUrl);
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary delete result:", result);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
