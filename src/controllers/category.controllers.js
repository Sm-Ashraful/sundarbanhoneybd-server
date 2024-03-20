import { Category } from "../models/category.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { nanoid } from "nanoid";
import slugify from "slugify";

const createCategories = (categories, parentId = null) => {
  const categoryList = [];
  let category;
  if (!parentId) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }
  for (let cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      slug: cate.slug,
      image: cate.image,
      parentId: cate.parentId,

      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
};

const addCategory = asyncHandler(async (req, res) => {
  //get data ->req.body
  //validate data
  //handle image if any
  //save file to cloudinary
  //varify if file save to cloudinary
  //verify if parent category exists
  //create category object
  //save category to database
  //return response

  const { name } = req.body;
  if (!name) {
    throw new ApiError(400, "Name is required");
  }
  const imagePath = req.files?.image[0]?.path;
  if (!imagePath) {
    throw new ApiError(400, "Category image is required");
  }

  const response = await uploadOnCloudinary(imagePath);

  if (!response) {
    throw new ApiError(400, "Invalid Category Image url");
  }

  const category = await Category.create({
    name: name.toLowerCase(),
    slug: `${slugify(req.body.name)}-${nanoid()}`,
    image: response.url,
    parentId: req.body?.parentId,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, "Category created successfully", category));
});

const getAllCategories = asyncHandler(async (req, res) => {
  // console.log("This is called: ", req);
  //get all category
  //return response
  const categories = await Category.find({}).sort({ createdAt: 1 });
  const categoryList = createCategories(categories);
  return res
    .status(200)
    .json(new ApiResponse(200, "All categories", categoryList));
});

const getCategoriesById = asyncHandler(async (req, res) => {
  const categoryId = req.body;
  const category = await Category.find({ categoryId });
  return res
    .status(200)
    .json(new ApiResponse(200, "Category Successfully Fetch", category));
});

export { addCategory, getAllCategories, getCategoriesById };
