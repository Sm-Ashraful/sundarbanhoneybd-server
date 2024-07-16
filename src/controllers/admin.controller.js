import { Client } from "../models/auth.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildTokens, setTokens } from "../utils/token.utils.js";
import bcrypt from "bcrypt";

const loginAdmin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const admin = await User.findOne({ phone, role: "ADMIN" });

  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { access_token, refresh_token } = buildTokens(admin);
  setTokens(res, access_token, refresh_token);
  return res.status(200).json(
    new ApiResponse(200, "Login Successfully", {
      access_token,
      user: admin,
    })
  );
});

export { loginAdmin };
