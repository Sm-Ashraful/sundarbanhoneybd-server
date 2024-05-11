import jwt from "jsonwebtoken";

const defaultCookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "strict",
};

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    console.log("Access token error: ", e);
  }
}

export function clearTokens(res) {
  res.cookie("access_token", "", { ...defaultCookieOptions, maxAge: 0 });
  res.cookie(refresh_token, "", { ...defaultCookieOptions, maxAge: 0 });
}
