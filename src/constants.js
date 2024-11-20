export const DB_NAME = "sundarbondhoneydb";
/**
 * @type {{ ADMIN: "ADMIN"; USER: "USER"; "GEUSt":"GEUST"} as const}
 */
export const UserRolesEnum = {
  ADMIN: "ADMIN",
  USER: "USER",
  GUEST: "GUEST",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

/**
 * @type {{ FLAT:"FLAT"; } as const}
 */
export const CouponTypeEnum = {
  FLAT: "FLAT",
  // PERCENTAGE: "PERCENTAGE",
};

export const AvailableCouponTypes = Object.values(CouponTypeEnum);

/**
 * @type {{ PENDING: "PENDING"; CANCELLED: "CANCELLED"; DELIVERED: "DELIVERED" } as const}
 */
export const OrderStatusEnum = {
  PENDING: "PENDING",
  CANCELLED: "CANCELLED",
  DELIVERED: "DELIVERED",
};

export const AvailableOrderStatuses = Object.values(OrderStatusEnum);

/**
 * @type {{ GOOGLE: "GOOGLE"; FACEBOOK: "FACEBOOK"; EMAIL_PASSWORD: "EMAIL_PASSWORD"} as const}
 */
export const UserLoginType = {
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
};

export const AvailableSocialLogins = Object.values(UserLoginType);

export const PaymentProviderEnum = {
  CASH: "CASH",
  BKASH: "BKASH",
  NAGOD: "NAGAD",
};

export const AvailablePaymentProviders = Object.values(PaymentProviderEnum);
