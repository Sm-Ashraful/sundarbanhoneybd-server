import { UserRolesEnum } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role != UserRolesEnum.ADMIN) {
    throw new ApiError(403, "You are not allowed to perform this action");
  }
  next();
});
