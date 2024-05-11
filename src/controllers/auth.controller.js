import { Client } from "../models/auth.models.js";
import otpGenerator from "otp-generator";
import { OTP } from "../models/otp.models.js";
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import _ from "lodash";
import { clearTokens, verifyRefreshToken } from "../utils/token.utils.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const client = await Client.findById(userId);
    // console.log("User before new accrcc: ", user);
    const access_token = client.generateAccessToken();
    const refresh_token = client.generateRefreshToken();

    // console.log("User after new rcc: ", user);
    return { access_token, refresh_token };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};

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

  let access_token;
  let refresh_token;

  if (rightOtpFind.phone === phone && validUser) {
    if (client) {
      await Client.findOneAndUpdate(
        { id: client._id },
        { $inc: { tokenVersion: 1 } }
      );
      access_token = client.generateAccessToken();
      refresh_token = client.generateRefreshToken();
      await client.save({ validateBeforeSave: false });
    } else {
      client = new Client(_.pick(req.body, ["phone"]));
      access_token = client.generateAccessToken();
      refresh_token = client.generateRefreshToken();
      await client.save({ validateBeforeSave: false });
    }
    const otpDelete = await OTP.deleteMany({
      phone: rightOtpFind.number,
    });

    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    };
    return res
      .status(200)

      .cookie("refresh_token", refresh_token, options)
      .cookie("access_token", access_token, options)
      .json(
        new ApiResponse(200, "Refresh token successfully", {
          user: client,
        })
      );
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
    console.log("current", current);
    const client = await Client.findById(current?._id);
    console.log("client", client);
    // console.log("User: ", user);
    if (!client) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== req.cookies["refresh_token"]) {
      throw new ApiError(401, "Refresh token is expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    };

    const { access_token, refresh_token } =
      await generateAccessTokenAndRefreshToken(client._id);

    console.log("New access token:", access_token);
    console.log("New access newRefreshToken:", refresh_token);

    return res
      .status(200)
      .cookie("access_token", access_token, options)
      .cookie("refresh_token", refresh_token, options)
      .json(new ApiResponse(200, "Refresh token successfully", {}));
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
  const user = await Client.findById(res.locals.access_token._id);
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
