import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getProducts,
  getAllProductWithoutPagination,
  getProductById,
  getProductsByCategory,
  createProduct,
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
router.route("/").get(getProducts);
// router.route("/all").get(getAllProductWithoutPagination);
// router.route("/special").get(getSpecialProducts);
// router.route("/dealsoftheday").get(getDealsOfTheDayProducts);
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
    {
      // frontend will send at max 4 `subImages` keys with file object which we will save in the backend
      name: "bannerImage",
      maxCount: 1, // maximum number of subImages is 4
    },
  ]),

  createProductValidator(),
  validate,
  verifyJWT,
  verifyAdmin,
  createProduct
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

router
  .route("/update/:productId")
  .patch(
    mongoIdPathVariableValidator("productId"),
    validate,
    verifyJWT,
    verifyAdmin,
    updateProduct
  );

router
  .route("/remove-sub-image/:productId/:subImageId")
  .delete(
    mongoIdPathVariableValidator("productId"),
    validate,
    verifyJWT,
    verifyAdmin,
    removeProductSubImage
  );

export default router;
