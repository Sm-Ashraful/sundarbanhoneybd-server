import mongoose from "mongoose";
import { Category } from "../models/category.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
  getMongoosePaginationOptions,
  getPublicIdFromUrl,
  removeLocalFile,
} from "../utils/helpers.js";
import { customSlugify } from "../utils/helpers.js";

//create product
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    price,
    stock,
    details,
    priority,
    discount,
    offerTimePeriod,
    offerBannerTitle,
    offerTitle,
    type,
  } = req.body;

  try {
    const categoryToBeAdded = await Category.findById(category);

    if (!categoryToBeAdded) {
      throw new ApiError(404, "Category does not exist");
    }

    // Check if user has uploaded a main image\
    const imagePath = req.files?.mainImage[0]?.path;
    if (!imagePath) {
      throw new ApiError(400, "Main image is required");
    }

    const mainImageRes = await uploadOnCloudinary(imagePath);
    const subImages = async () => {
      if (req.files.subImages && req.files.subImages.length) {
        const subImagesArray = [];

        for (const image of req.files.subImages) {
          const imageUrl = image.path;
          const response = await uploadOnCloudinary(imageUrl);
          subImagesArray.push({ url: response.url });
        }

        return subImagesArray;
      } else {
        return [];
      }
    };

    const subImagesResult = await subImages();
    // Handle offer banner image if it exists (for special and dealsOfTheDay types)
    let bannerImage;
    if (type === "special" || type === "dealsOfTheDay") {
      const bannerImagePath = req.files?.bannerImage[0]?.path;
      if (bannerImagePath) {
        bannerImage = await uploadOnCloudinary(bannerImagePath);
      }
    }

    const owner = req.user._id;

    const productData = {
      name,
      slug: customSlugify(name),
      description,
      stock,
      price,
      owner,
      weight: req.body?.weight,
      element: req.body?.element,
      mainImage: {
        url: mainImageRes.url,
      },
      subImages: subImagesResult,
      category,
      details,
      priority,
      type: type?.toUpperCase(), // Store the type as uppercase (REGULAR, OFFER, SPECIAL, DEALSOFTHEDAY)
    };

    // Add discount percent if the product is an offer, special, or deals of the day
    if (type === "offer" || type === "special" || type === "dealsOfTheDay") {
      productData.discount = discount;
    }

    // Add additional fields for special and deals of the day products
    if (type === "special" || type === "dealsOfTheDay") {
      productData.offerTimePeriod = offerTimePeriod;
      productData.offerBannerTitle = offerBannerTitle;
      productData.offerTitle = offerTitle;

      if (bannerImage) {
        productData.bannerImage = {
          url: bannerImage.url,
        };
      }
    }

    const product = await Product.create(productData);
    return res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", product));
  } catch (error) {
    console.log("Error: ", error);
    throw new ApiError(404, "Not Found");
  }
});

const updateProductToOffer = asyncHandler(async (req, res) => {
  const {
    offerTimePeriod,
    offerTitle,
    offerBannerTitle,
    discount,
    type, // Should be "SPECIAL" or "DEALSOFTHEDAY"
  } = req.body;

  try {
    const productId = req.params.id;

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Ensure the type is either SPECIAL or DEALSOFTHEDAY
    if (type !== "OFFER" && type !== "SPECIAL" && type !== "DEALSOFTHEDAY") {
      throw new ApiError(400, "Invalid product type for offerable product");
    }

    // Update the product to include offer-related fields
    product.type = type;
    product.offerTimePeriod = offerTimePeriod;
    product.offerTitle = offerTitle;
    product.offerBannerTitle = offerBannerTitle;
    product.discount = discount;

    // Handle optional banner image
    const bannerImagePath = req.files?.bannerImage?.[0]?.path;
    if (bannerImagePath) {
      const bannerImageRes = await uploadOnCloudinary(bannerImagePath);
      product.bannerImage = { url: bannerImageRes.url };
    }

    // Save the updated product
    await product.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Product updated to offerable successfully",
          product
        )
      );
  } catch (error) {
    console.log("Error: ", error);
    throw new ApiError(404, "Not Found");
  }
});

const getProducts = asyncHandler(async (req, res) => {
  try {
    let { page = 1, limit = 8, type } = req.query;

    if (limit === "all") {
      limit = 0;
    } else {
      limit = parseInt(limit, 10);
    }

    const filter = {};

    // Apply filtering based on the type
    if (type === "all") {
      const products = await Product.find({});

      return res
        .status(200)
        .json(new ApiResponse(200, "Products fetched successfully", products));
    } else {
      filter.type = type?.toUpperCase();
      console.log("object:", filter);

      const productAggregate = Product.aggregate([{ $match: filter }]);

      const paginationOptions = getMongoosePaginationOptions({
        page,
        limit,
        customLabels: {
          totalDocs: "totalProducts",
          docs: "products",
        },
      });

      const products = await Product.aggregatePaginate(
        productAggregate,
        paginationOptions
      );

      return res
        .status(200)
        .json(new ApiResponse(200, "Products fetched successfully", products));
    }
  } catch (error) {
    console.log("Product error: ", error);
  }
});

const getAllProductWithoutPagination = asyncHandler(async (req, res) => {
  const products = await Product.find({});

  return res
    .status(201)
    .json(new ApiResponse(201, "All Product fetched.", products));
});

const getSpecialProducts = asyncHandler(async (req, res) => {
  try {
    const specialProducts = await Product.find({ type: "SPECIAL" }).sort({
      createdAt: -1,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, "Product found successfully", specialProducts)
      );
  } catch (error) {
    console.error("Error: ", error);
    throw new ApiError(400, "Not found");
  }
});

const getDealsOfTheDayProducts = asyncHandler(async (req, res) => {
  try {
    const dealsOfTheDay = await Product.find({ type: "DEALSOFTHEDAY" }).sort({
      createdAt: -1,
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Product found successfully", dealsOfTheDay));
  } catch (error) {
    console.error("Error: ", error);
    throw new ApiError(400, "Not found");
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    name,
    description,
    category,
    price,
    stock,
    weight,
    element,
    details,
    priority,
    status,
  } = req.body;

  const product = await Product.findById(productId);

  // Check if the product exists
  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  // Handle main image update
  let mainImage;
  if (req.files?.mainImage?.length) {
    // Upload the new main image to Cloudinary
    const mainImageRes = await uploadOnCloudinary(req.files.mainImage[0].path);
    mainImage = { url: mainImageRes.url };

    // Remove the old main image from Cloudinary
    if (product.mainImage.url) {
      await deleteFromCloudinary(product.mainImage.url);
    }
  } else {
    mainImage = product.mainImage; // If no new main image is uploaded, keep the existing one
  }

  // Handle sub-images update
  let subImages =
    req.files?.subImages && req.files.subImages?.length
      ? await Promise.all(
          req.files.subImages.map(async (image) => {
            const imageUrl = await uploadOnCloudinary(image.path);
            return { url: imageUrl.url };
          })
        )
      : []; // If no new sub-images are uploaded, start with an empty array

  const existedSubImages = product.subImages.length; // Existing sub-images count
  const newSubImages = subImages.length; // Newly uploaded sub-images count
  const totalSubImages = existedSubImages + newSubImages;

  if (totalSubImages > 5) {
    // If total sub-images exceed the allowed limit, perform cleanup and throw an error
    subImages?.map((img) => removeLocalFile(img.localPath));
    if (product.mainImage.url !== mainImage.url) {
      removeLocalFile(mainImage.localPath);
    }
    throw new ApiError(
      400,
      `Maximum 5 sub-images are allowed for a product. There are already ${existedSubImages} sub-images attached to the product.`
    );
  }

  // Merge the existing sub-images with the newly uploaded ones
  subImages = [...product.subImages, ...subImages];

  // Update the product
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        name,
        description,
        category,
        price,
        stock,
        weight,
        element,
        details,
        priority,
        status,
        mainImage,
        subImages,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});
const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  console.log("Product id: ", productId);
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Product fetched successfully", product));
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  console.log("Params: ", categoryId, page, limit);
  const category = await Category.findById(categoryId).select("name _id");
  console.log("Category: ", category);
  if (!category) {
    throw new ApiError(404, "Category does not exist");
  }

  const productAggregate = Product.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId),
      },
    },
  ]);

  const paginationOptions = getMongoosePaginationOptions({
    page,
    limit,
    customLabels: {
      totalDocs: "totalProducts",
      docs: "products",
    },
  });

  const products = await Product.aggregatePaginate(
    productAggregate,
    paginationOptions
  );
  console.log("Products: ", products);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Category products fetched successfully", products)
    );
});

const removeProductSubImage = asyncHandler(async (req, res) => {
  const { productId, subImageId } = req.params;

  const product = await Product.findById(productId);

  // Check for product existence
  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  // Find the sub-image being removed
  const removedSubImage = product.subImages?.find((image) => {
    return image._id.toString() === subImageId;
  });

  // If the sub-image exists, remove it from Cloudinary
  if (removedSubImage) {
    const publicId = getPublicIdFromUrl(removedSubImage.url);
    await deleteFromCloudinary(publicId);
  }

  // Update the product by pulling the sub-image from the array
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $pull: {
        subImages: { _id: new mongoose.Types.ObjectId(subImageId) },
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProduct, "Sub-image removed successfully")
    );
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Find and delete the product from the database
  const product = await Product.findOneAndDelete({ _id: productId });

  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  // Collect all product images (main and sub-images)
  const productImages = [product.mainImage, ...product.subImages];

  // Iterate over the images and remove them from Cloudinary
  await Promise.all(
    productImages.map(async (image) => {
      const publicId = getPublicIdFromUrl(image.url);
      await deleteFromCloudinary(publicId);
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedProduct: product },
        "Product deleted successfully"
      )
    );
});

export {
  createProduct,
  updateProductToOffer,
  getProducts,
  getProductById,
  getProductsByCategory,
  getAllProductWithoutPagination,
  updateProduct,
  deleteProduct,
  removeProductSubImage,
};
