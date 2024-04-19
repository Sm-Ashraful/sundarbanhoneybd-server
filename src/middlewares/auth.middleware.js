import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // console.log("req.header verify: ", req.header("Authorization"));
  // console.log("Req.cookies: ,", req.cookies);
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password");
    if (!user) {
      throw new ApiError(401, "Invalid token");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token");
  }
});

export const verifyPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You are not allowed to perform this action");
    }
    next();
  });
};
