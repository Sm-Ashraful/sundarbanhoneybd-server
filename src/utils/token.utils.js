import jwt from "jsonwebtoken";

const defaultCookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "strict",
};

const TokenExpiration = {
  Access: 5 * 60, // 5 minutes in seconds
  Refresh: 7 * 24 * 60 * 60, // 7 days in seconds
  RefreshIfLessThan: 4 * 24 * 60 * 60, // 4 days in seconds
};

const refreshTokenCookieOptions = {
  ...defaultCookieOptions,
  maxAge: TokenExpiration.Refresh * 1000,
};

const accessTokenCookieOptions = {
  ...defaultCookieOptions,
  maxAge: TokenExpiration.Access * 1000,
};

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: TokenExpiration.Access,
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: TokenExpiration.Refresh,
  });
}

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

export function buildTokens(user) {
  const accessPayload = { _id: user._id, phone: user.phone };
  const refreshPayload = {
    _id: user._id,
    phone: user.phone,
    version: user.tokenVersion,
  };

  const access_token = signAccessToken(accessPayload);
  const refresh_token = refreshPayload && signRefreshToken(refreshPayload);

  return { access_token, refresh_token };
}

export function setTokens(res, access, refresh) {
  res.cookie("access_token", access, accessTokenCookieOptions);
  res.cookie("refresh_token", refresh, refreshTokenCookieOptions);
}

export function refreshTokens(current, tokenVersion) {
  if (tokenVersion !== current.version) throw "Token revoked";

  const accessPayload = { _id: current._id, name: current.name };

  const refreshPayload = {
    _id: current._id,
    name: current.name,
    version: tokenVersion,
  };

  const access_token = signAccessToken(accessPayload);
  const refresh_token = signRefreshToken(refreshPayload);

  return { access_token, refresh_token };
}

export function clearTokens(res) {
  res.cookie("access_token", "", { ...defaultCookieOptions, maxAge: 0 });
  res.cookie("refresh_token", "", { ...defaultCookieOptions, maxAge: 0 });
}
