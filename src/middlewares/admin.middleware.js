import { UserRolesEnum } from "../constants.js";

export const verifyAdmin = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user.role != UserRolesEnum.ADMIN) {
      throw new ApiError(403, "You are not allowed to perform this action");
    }
    next();
  });
};
