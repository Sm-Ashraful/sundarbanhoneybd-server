import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getAllProducts,
  getAllProductWithoutPagination,
  getProductById,
  getProductsByCategory,
  getSpecialProducts,
  createOfferProduct,
  createRegularProduct,
  deleteProduct,
  removeProductSubImage,
  updateProduct,
  updateProductToOffer,
} from "../controllers/product.controller.js";
import { createProductValidator } from "../validators/product.validators.js";
import { validate } from "../validators/validate.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";

const router = Router();
router.route("/").get(getAllProducts);
router.route("/all").get(getAllProductWithoutPagination);
router.route("/special").get(getSpecialProducts);
router.route("/:categoryId").get(getProductsByCategory);
router.route("/pid/:productId").get(
  mongoIdPathVariableValidator("productId"),
  validate,

  getProductById
);
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
  verifyJWT,
  verifyAdmin,
  createRegularProduct
);
router.route("/create-offer").post(
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
  verifyJWT,
  verifyAdmin,
  createOfferProduct
);
router
  .route("/make-offer/:productId")
  .post(
    verifyJWT,
    verifyAdmin,
    mongoIdPathVariableValidator("productId"),
    upload.fields([{ name: "bannerImage", maxCount: 1 }]),
    validate,
    updateProductToOffer
  );
router
  .route("/delete/:productId")
  .delete(
    verifyJWT,
    verifyAdmin,
    mongoIdPathVariableValidator("productId"),
    validate,
    deleteProduct
  );

router.route("/update/:productId").patch(
  mongoIdPathVariableValidator("productId"), // Middleware to validate the product ID
  validate, // Middleware to validate request data
  verifyJWT, // Middleware to ensure the user is authenticated
  verifyAdmin, // Middleware to ensure the user is an admin
  updateProduct // Controller function to handle the update logic
);

router.route("/remove-sub-image/:productId/:subImageId").delete(
  mongoIdPathVariableValidator("productId"),
  validate, // if you need any specific validation here
  verifyJWT,
  verifyAdmin,
  removeProductSubImage
);

export default router;
