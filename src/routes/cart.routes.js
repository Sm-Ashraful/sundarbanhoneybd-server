import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addItemOrUpdateItemQuantity,
  removeItemFromCart,
  clearCart,
  getClientCart,
} from "../controllers/cart.controller.js";
import { validate } from "../validators/validate.js";
import { addItemOrUpdateItemQuantityValidator } from "../validators/cart.validator.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getClientCart);

router.route("/clear").delete(clearCart);

router
  .route("/item/:productId")
  .post(
    mongoIdPathVariableValidator("productId"),
    addItemOrUpdateItemQuantityValidator(),
    validate,
    addItemOrUpdateItemQuantity
  )
  .delete(
    mongoIdPathVariableValidator("productId"),
    validate,
    removeItemFromCart
  );

export default router;
