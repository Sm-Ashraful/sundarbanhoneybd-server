import { Router } from "express";
import {
  addCategory,
  getAllCategories,
  getProductByCategoryId,
} from "../controllers/category.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/add-category")
  .post(upload.fields([{ name: "image", maxCount: 1 }]), addCategory);
router.route("/").get(getAllCategories);
router.route("/get-product-by-category").get(getProductByCategoryId);
export default router;
