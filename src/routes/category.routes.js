import { Router } from "express";
import {
  addCategory,
  getAllCategories,
  getCategoriesById,
} from "../controllers/category.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/add-category")
  .post(upload.fields([{ name: "image", maxCount: 1 }]), addCategory);
router.route("/get-categories").get(getAllCategories);
// router.route("/get-category").post(getCategoriesById);
export default router;
