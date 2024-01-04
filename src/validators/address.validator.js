import { body, param } from "express-validator";

const createAddressValidator = () => {
  return [
    body("addressLine1")
      .trim()
      .notEmpty()
      .withMessage("Address line 1 is required"),
    body("district").trim().notEmpty().withMessage("District is required"),
    body("postcode")
      .trim()
      .notEmpty()
      .withMessage("postcode is required")
      .isNumeric()
      .isLength({ max: 6, min: 6 })
      .withMessage("Invalid pincode"),
    body("state").trim().notEmpty().withMessage("State is required"),
  ];
};

const updateAddressValidator = () => {
  return [
    body("addressLine1")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Address line 1 is required"),
    body("district")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("District is required"),

    body("postcode")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("postcode is required")
      .isNumeric()
      .withMessage("Invalid postcode"),
    body("state").optional().trim().notEmpty().withMessage("State is required"),
  ];
};

export { createAddressValidator, updateAddressValidator };
