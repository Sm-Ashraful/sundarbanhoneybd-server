import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  checkoutItems,
  clearCheckout,
  getUserCheckout,
} from "../controllers/checkout.controller.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";
import { validate } from "../validators/validate.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getUserCheckout);

router.route("/clear").delete(clearCheckout);

router
  .route("/item/:productId")
  .post(mongoIdPathVariableValidator("productId"), validate, checkoutItems);

export default router;
