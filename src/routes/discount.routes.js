import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateDiscount } from "../controllers/discount.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/validate", validateDiscount);

export default router;
