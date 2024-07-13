import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getCurrentUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { loginAdmin } from "../controllers/admin.controller.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginAdmin);
//admin routes

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router;
