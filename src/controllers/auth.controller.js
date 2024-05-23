import { Client } from "../models/auth.models.js";
import otpGenerator from "otp-generator";
import { OTP } from "../models/otp.models.js";
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import _ from "lodash";
import {
  buildTokens,
  clearTokens,
  refreshTokens,
  setTokens,
  verifyRefreshToken,
} from "../utils/token.utils.js";

const loginClient = asyncHandler(async (req, res) => {
  //get data ->req.body
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone is required");
  }
  //find that user
  const otpNum = otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  console.log("Otp num: ", otpNum);
  const otp = new OTP({ phone: phone, otp: otpNum });
  const salt = await bcrypt.genSalt(10);
  otp.otp = await bcrypt.hash(otp.otp, salt);
  const result = await otp.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP send successfully", result));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  let client = await Client.findOne({ phone });
  const otpHolder = await OTP.find({
    phone: phone,
  });

  if (otpHolder.length === 0) throw new ApiError(400, "Your OTP is expired");

  const rightOtpFind = otpHolder[otpHolder.length - 1];
  const validUser = await bcrypt.compare(otp, rightOtpFind.otp);

  if (rightOtpFind.phone === phone && validUser) {
    if (client) {
      await Client.findOneAndUpdate(
        { id: client._id },
        { $inc: { tokenVersion: 1 } }
      );
      const { access_token, refresh_token } = buildTokens(client);
      const otpDelete = await OTP.deleteMany({
        phone: rightOtpFind.number,
      });
      setTokens(res, access_token, refresh_token);
      return res.status(200).json(
        new ApiResponse(200, "Login Successfully", {
          access_token: access_token,
          user: client,
        })
      );
    } else {
      client = new Client(_.pick(req.body, ["phone"]));
      const { access_token, refresh_token } = buildTokens(client);
      await client.save({ validateBeforeSave: false });
      const otpDelete = await OTP.deleteMany({
        phone: rightOtpFind.number,
      });
      setTokens(res, access_token, refresh_token);
      return res.status(200).json(
        new ApiResponse(200, "Login Successfully", {
          access_token: access_token,
          user: client,
        })
      );
    }
  } else {
    throw new ApiError(400, "Your otp is wrong");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //check if refresh token is valid
  //generate new access token
  //return response
  //access refresh token
  const incomingRefreshToken = req.cookies?.refresh_token;
  console.log("incomingRefreshToken", incomingRefreshToken);
  //in no refresh token
  if (!incomingRefreshToken) {
    throw new ApiError(401, "No Request token available");
  }

  try {
    //decode incoming request token for find user
    const current = verifyRefreshToken(incomingRefreshToken);
    const client = await Client.findById(current?._id);

    if (!client) {
      throw new ApiError(401, "Client not found!");
    }

    if (incomingRefreshToken !== req.cookies["refresh_token"]) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const { access_token, refresh_token } = refreshTokens(
      current,
      client.tokenVersion
    );

    setTokens(res, access_token, refresh_token);
    return res.status(200).json(
      new ApiResponse(200, "Generate new access toke successfully", {
        user: client,
        access_token: access_token,
      })
    );
  } catch (error) {
    console.log("Icoming error: ", error);
    clearTokens(res);
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const logoutClient = asyncHandler(async (req, res, next) => {
  clearTokens(res);
  res.status(200).json(new ApiResponse(200, "Logout successfully", {}));
});

const getCurrentClient = asyncHandler(async (req, res) => {
  const user = await Client.findById(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", user));
});

export {
  loginClient,
  verifyOtp,
  logoutClient,
  refreshAccessToken,
  getCurrentClient,
};
