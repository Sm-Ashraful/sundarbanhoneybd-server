import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

import {
  createBanner,
  getAllBanners,
} from "../controllers/banner.controller.js";
import { validate } from "../validators/validate.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router
  .route("/create-banner")
  .post(
    upload.fields([{ name: "bannerImage", maxCount: 1 }]),
    validate,
    verifyJWT,
    verifyAdmin,
    createBanner
  );

router.route("/").get(getAllBanners);

export default router;
