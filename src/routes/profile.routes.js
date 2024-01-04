import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getMyOrders,
  getMyProfile,
  updateProfile,
} from "../controllers/profile.controller.js";
import { validate } from "../validators/validate.js";
import { updateProfileValidator } from "../validators/profile.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getMyProfile)
  .patch(updateProfileValidator(), validate, updateProfile);

router.route("/my-orders").get(getMyOrders);

export default router;
