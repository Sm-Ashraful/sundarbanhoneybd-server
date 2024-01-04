import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createAddressValidator,
  updateAddressValidator,
} from "../validators/address.validator.js";
import {
  createAddress,
  deleteAddress,
  getAddressById,
  getAllAddresses,
  updateAddress,
} from "../controllers/address.controller.js";
import { validate } from "../validators/validate.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";
const router = Router();

// All routes require authentication
router.use(verifyJWT);

router
  .route("/")
  .post(createAddressValidator(), validate, createAddress)
  .get(getAllAddresses);

router
  .route("/:addressId")
  .get(mongoIdPathVariableValidator("addressId"), validate, getAddressById)
  .delete(mongoIdPathVariableValidator("addressId"), validate, deleteAddress)
  .patch(
    updateAddressValidator(),
    mongoIdPathVariableValidator("addressId"),
    validate,
    updateAddress
  );

export default router;
