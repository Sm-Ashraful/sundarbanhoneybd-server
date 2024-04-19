import { Banner } from "../models/banner.models.js";
import { Product } from "../models/product.models.js";
import { Category } from "../models/category.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { customSlugify } from "../utils/helpers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create a new banner
const createBanner = asyncHandler(async (req, res) => {
  try {
    // Validate the linkType and other data based on your requirements
    const { title, subTitle, linkType } = req.body;
    console.log("Req.files: ", req.files);
    const imagePath = req.files?.bannerImage[0]?.path;
    if (!imagePath) {
      throw new ApiError(400, "Banner image is required");
    }

    const bannerImage = await uploadOnCloudinary(imagePath);
    const newBanner = new Banner({
      bannerImage: bannerImage.url,
      title,
      subTitle,
      linkType,
      slug: customSlugify(title),
    });

    if (newBanner.linkType === "shop") {
      newBanner.shopLink = "/shop";
    }

    // Conditional logic if using references
    if (newBanner.linkType === "product") {
      const product = await Product.findById(newBanner.product);
      if (!product) {
        throw new ApiError(400, "Product doesn't found");
      }
    } // Similar logic for category

    if (newBanner.linkType === "category") {
      const category = await Category.findById(newBanner.category);
      if (!category) {
        throw new ApiError(400, "Category doesn't found");
      }
    }

    const savedBanner = await newBanner.save();
    return res
      .status(201)
      .json(new ApiResponse(201, "Banner created successfully", savedBanner));
  } catch (err) {
    throw new ApiError(500, `${err.message}`);
  }
});

// Get all banners
const getAllBanners = asyncHandler(async (req, res) => {
  // console.log("Rea.status: ", req);
  try {
    const banners = await Banner.find({});
    // Consider populating associated Product/Category if using references
    return res.status(200).json(new ApiResponse(200, "Successful", banners));
  } catch (err) {
    throw new ApiError(500, "Server Error", `{${err.message}}`);
  }
});
// Get a single banner
// exports.getBanner = async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.bannerId);
//     // ... (similar population logic)
//     if (!banner) {
//       return res.status(404).json({ error: "Banner not found" });
//     }
//     res.json(banner);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// ... Other controller actions: updateBanner, deleteBanner, etc.

export { createBanner, getAllBanners };
