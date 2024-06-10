import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createShippingCost,
  getCities,
} from "../controllers/shippingCost.controller.js";

const router = Router();

// router.use(verifyJWT);

router.route("/").get(getCities);
router.route("/add").post(createShippingCost);

export default router;
