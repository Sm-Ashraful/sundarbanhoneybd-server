import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/token.utils.js";
import { Client } from "../models/auth.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    let user = await Client.findById(decodedToken?._id).select("-password");
    console.log("User: ", user);
    if (!user) {
      user = await User.findById(decodedToken?._id).select("-password");
    }
    if (!user) {
      throw new ApiError(401, "Invalid token");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token");
  }
});

/**
 * @param {AvailableUserRoles} roles
 * @description
 * * This middleware is responsible for validating multiple user role permissions at a time.
 * * So, in future if we have a route which can be accessible by multiple roles, we can achieve that with this middleware
 */

export const verifyPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized request");
    }
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(403, "You are not allowed to perform this action");
      next();
    } else {
      throw new ApiError(403, "You are not allowed to perform this action");
    }
  });
};

export const authMiddleware = asyncHandler(async (req, res, next) => {
  console.log("req.cookies", req.cookies);
  const token = verifyAccessToken(
    req.cookies["access_token"] || req.headers.cookie["access_token"]
  );
  console.log("TOken: ", token);
  if (!token) {
    throw new ApiError(401, "Not Signed in");
  }

  res.locals.access_token = token;

  next();
});
