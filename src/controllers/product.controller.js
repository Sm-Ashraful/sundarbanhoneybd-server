import mongoose from "mongoose";
import { Category } from "../models/category.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";
import { customSlugify } from "../utils/helpers.js";

const getAllProducts = asyncHandler(async (req, res) => {
  let { page = 1, limit = 8 } = req.query;

  // Check if limit is 'all' and set it to a very large number (or remove the limit)
  if (limit === "all") {
    limit = 0; // Set limit to 0 or a very large number to fetch all products
  } else {
    limit = parseInt(limit, 10); // Convert limit to integer
  }

  const productAggregate = Product.aggregate([{ $match: {} }]);

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
});

const getAllProductWithoutPagination = asyncHandler(async (req, res) => {
  const products = await Product.find({});

  return res
    .status(201)
    .json(new ApiResponse(201, "All Product fetched.", products));
});

const getSpecialProducts = asyncHandler(async (req, res) => {
  try {
    const specialProducts = await Product.find({ productType: "special" });

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

//save product into database
const createProduct = asyncHandler(async (req, res) => {
  console.log("Req.body: ", req.body);
  const {
    name,
    description,
    category,
    price,
    stock,
    details,
    discountPercent,
    priority,
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

    const owner = req.user._id;

    let sellingPrice = 0;
    if (discountPercent) {
      sellingPrice = price - (price * discountPercent) / 100;
    } else {
      sellingPrice = price;
    }

    const product = await Product.create({
      name,
      slug: customSlugify(name),
      description,
      stock,
      price,
      sellingPrice,

      discountPercent,
      owner,
      mainImage: {
        url: mainImageRes.url,
      },
      subImages: subImagesResult,
      category,
      details,
      priority: priority,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", product));
  } catch (error) {
    console.log("Error: ", error);
    throw new ApiError(404, "Not Found");
  }
});

// const updateProduct = asyncHandler(async (req, res) => {
//   const { productId } = req.params;
//   const { name, description, category, price, stock } = req.body;

//   const product = await Product.findById(productId);

//   // Check the product existence
//   if (!product) {
//     throw new ApiError(404, "Product does not exist");
//   }

//   const mainImage = req.files?.mainImage?.length
//     ? {
//         // If user has uploaded new main image then we have to create an object with new url and local path in the project
//         url: getStaticFilePath(req, req.files?.mainImage[0]?.filename),
//         localPath: getLocalPath(req.files?.mainImage[0]?.filename),
//       }
//     : product.mainImage; // if there is no new main image uploaded we will stay with the old main image of the product

//   /**
//    * @type {{ url: string; localPath: string; }[]}
//    */
//   let subImages =
//     // If user has uploaded new sub images then we have to create an object with new url and local path in the array format
//     req.files?.subImages && req.files.subImages?.length
//       ? req.files.subImages.map((image) => {
//           const imageUrl = getStaticFilePath(req, image.filename);
//           const imageLocalPath = getLocalPath(image.filename);
//           return { url: imageUrl, localPath: imageLocalPath };
//         })
//       : []; // if there are no new sub images uploaded we want to keep an empty array

//   const existedSubImages = product.subImages.length; // total sub images already present in the project
//   const newSubImages = subImages.length; // Newly uploaded sub images
//   const totalSubImages = existedSubImages + newSubImages;

//   if (totalSubImages > MAXIMUM_SUB_IMAGE_COUNT) {
//     // We want user to only add at max 4 sub images
//     // If the existing sub images + new sub images count exceeds 4
//     // We want to throw an error

//     // Before throwing an error we need to do some cleanup

//     // remove the  newly uploaded sub images by multer as there is not updation happening
//     subImages?.map((img) => removeLocalFile(img.localPath));
//     if (product.mainImage.url !== mainImage.url) {
//       // If use has uploaded new main image remove the newly uploaded main image as there is no updation happening
//       removeLocalFile(mainImage.localPath);
//     }
//     throw new ApiError(
//       400,
//       "Maximum " +
//         MAXIMUM_SUB_IMAGE_COUNT +
//         " sub images are allowed for a product. There are already " +
//         existedSubImages +
//         " sub images attached to the product."
//     );
//   }

//   // If above checks are passed. We need to merge the existing sub images and newly uploaded sub images
//   subImages = [...product.subImages, ...subImages];

//   const updatedProduct = await Product.findByIdAndUpdate(
//     productId,
//     {
//       $set: {
//         name,
//         description,
//         stock,
//         price,
//         category,
//         mainImage,
//         subImages,
//       },
//     },
//     {
//       new: true,
//     }
//   );

//   // Once the product is updated. Do some cleanup
//   if (product.mainImage.url !== mainImage.url) {
//     // If user is uploading new main image remove the previous one because we don't need that anymore
//     removeLocalFile(product.mainImage.localPath);
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
// });

const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
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
  console.log("productAggregate", productAggregate);

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

// const removeProductSubImage = asyncHandler(async (req, res) => {
//   const { productId, subImageId } = req.params;

//   const product = await Product.findById(productId);

//   // check for product existence
//   if (!product) {
//     throw new ApiError(404, "Product does not exist");
//   }

//   const updatedProduct = await Product.findByIdAndUpdate(
//     productId,
//     {
//       $pull: {
//         // pull an item from subImages with _id equals to subImageId
//         subImages: {
//           _id: new mongoose.Types.ObjectId(subImageId),
//         },
//       },
//     },
//     { new: true }
//   );

//   // retrieve the file object which is being removed
//   const removedSubImage = product.subImages?.find((image) => {
//     return image._id.toString() === subImageId;
//   });

//   if (removedSubImage) {
//     // remove the file from file system as well
//     removeLocalFile(removedSubImage.localPath);
//   }

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, updatedProduct, "Sub image removed successfully")
//     );
// });

// const deleteProduct = asyncHandler(async (req, res) => {
//   const { productId } = req.params;

//   const product = await Product.findOneAndDelete({
//     _id: productId,
//   });

//   if (!product) {
//     throw new ApiError(404, "Product does not exist");
//   }

//   const productImages = [product.mainImage, ...product.subImages];

//   productImages.map((image) => {
//     // remove images associated with the product that is being deleted
//     removeLocalFile(image.localPath);
//   });

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         { deletedProduct: product },
//         "Product deleted successfully"
//       )
//     );
// });

export {
  createProduct,
  getAllProducts,
  getProductById,
  getSpecialProducts,
  getProductsByCategory,
  getAllProductWithoutPagination,
  //   updateProduct,
  //   removeProductSubImage,
};
