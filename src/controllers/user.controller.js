import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation (if not empty)
  //if user already exists: email, phone
  //create user object
  //remove password and refresh token field from response
  //check for user creation
  //return responses

  const { name, phone, email, password } = req.body;
  if ([name, phone, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ phone });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    name: name.toLowerCase(),
    phone,
    email: email?.toLowerCase() || "",
    password,
  });
  //remove field
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "User not created");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

export { registerUser };
