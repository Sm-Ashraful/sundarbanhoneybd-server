import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { UserRolesEnum } from "../constants.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation (if not empty)
  //if user already exists: email, phone
  //create user object
  //remove password and refresh token field from response
  //check for user creation
  //return responses

  const { name, phone, email, password, role } = req.body;
  if ([name, phone, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ phone }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    name: name.toLowerCase(),
    phone,
    email: email?.toLowerCase() || "",
    password,
    role: role || UserRolesEnum.USER,
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
    .json(new ApiResponse(200, "User created successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  //get data ->req.body
  //phone number / email and password
  //find the user
  //check passowrd
  //access and refresh token
  //send cookie
  //return response

  const { phone, email, password } = req.body;
  if (!phone && !email) {
    throw new ApiError(400, "Phone or email is required");
  }
  const user = await User.findOne({ $or: [{ phone }, { email }] });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Login successfully", {
        user: loginUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //find the user by id
  //remove refresh token
  //return response
  console.log("Response: ", req.user);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "Logout successfully", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get access token from cookie
  //check if refresh token is valid
  //generate new access token
  //return response
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorize request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,

          "Refresh token successfully",
          {
            accessToken,
            refreshToken: newRefreshToken,
          }
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", req.user));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
};
