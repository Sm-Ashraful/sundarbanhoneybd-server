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
  const { name, phone, email, password, role } = req.body;
  //validation (if not empty)
  if ([name, phone, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  //if user already exists: email, phone
  const existedUser = await User.findOne({ $or: [{ phone }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  //create user object
  const user = await User.create({
    name: name.toLowerCase(),
    phone,
    email: email?.toLowerCase() || "", //email is optional
    password,
    role: role || UserRolesEnum.USER,
  });
  //remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //check for user creation is ok or not
  if (!createdUser) {
    throw new ApiError(500, "User not created");
  }
  //return responses
  return res
    .status(201)
    .json(new ApiResponse(200, "User created successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  //get data ->req.body
  const { phone, password } = req.body;
  if (!phone && !email) {
    throw new ApiError(400, "Phone or email is required");
  }
  //find that user
  const user = await User.findOne({ phone });
  //not found
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  //password verification
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  //generate access and refresh token
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  //make login user for response
  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // generate option
  const options = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "strict",
  };
  //return response with cookies
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Login successfully", {
        accessToken,
        user: loginUser,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //find the user by id
  //remove refresh token
  //return respons
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
  //check if refresh token is valid
  //generate new access token
  //return response
  //access refresh token
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  //in no refresh token
  if (!incomingRefreshToken) {
    throw new ApiError(401, "No Request token available");
  }

  try {
    //decode incoming request token for find user
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    // console.log("decoded token: ", decodedToken);
    //find user with decode user
    const user = await User.findById(decodedToken?._id);
    // console.log("User: ", user);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    console.log("incomingRefreshToken: ", incomingRefreshToken);
    console.log("user?.refreshToken: ", user?.refreshToken);
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    };

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    console.log("New access token:", accessToken);
    console.log("New access newRefreshToken:", refreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Refresh token successfully", {
          accessToken,
          refreshToken,
        })
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
