import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createProduct,
  getAllProducts,
} from "../controllers/product.controller.js";
import { createProductValidator } from "../validators/product.validators.js";
import { validate } from "../validators/validate.js";

const router = Router();
router.route("/").get(getAllProducts);
router.route("/create-product").post(
  upload.fields([
    {
      name: "mainImage",
      maxCount: 1,
    },
    {
      // frontend will send at max 4 `subImages` keys with file object which we will save in the backend
      name: "subImages",
      maxCount: 4, // maximum number of subImages is 4
    },
  ]),
  createProductValidator(),
  validate,
  createProduct
);

export default router;
