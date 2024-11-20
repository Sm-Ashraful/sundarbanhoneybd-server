import { Router } from "express";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middleware.js";

import { UserRolesEnum } from "../constants.js";
import { validate } from "uuid";
import {
  createOrder,
  getOrdersByCustomerId,
} from "../controllers/order.controller.js";
// import { orderUpdateStatusValidator } from "../validators/order.validator.js";

const router = Router();

//for geust user order
router.use(verifyJWT);
router.route("/").post(createOrder);
router.route("/my-order").get(getOrdersByCustomerId);
export default router;
