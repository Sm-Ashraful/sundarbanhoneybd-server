import { Router } from "express";
import {
  getCurrentClient,
  loginClient,
  logoutClient,
  refreshAccessToken,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { authMiddleware, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/otp-login").post(loginClient);
router.route("/verify").post(verifyOtp);
router.route("/refresh").post(refreshAccessToken);
//admin routes
router.route("/logout").post(authMiddleware, logoutClient);
router.route("/me").get(verifyJWT, getCurrentClient);

//secured routes

export default router;
