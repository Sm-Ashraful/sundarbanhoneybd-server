import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import { corsOptions } from "./config/cors/cors.js";
const corsOptions = {
  origin: [
    "https://sundarbanhoneybd.com",
    "http://localhost:3000",
    "http://sundarbanhoneybd.com",
    "https://www.sundarbanhoneybd.com",
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import categoryRouter from "./routes/category.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import addressRouter from "./routes/address.routes.js";
import profileRouter from "./routes/profile.routes.js";
import bannerRouter from "./routes/banner.routes.js";
import { logger } from "./middlewares/logger.js";
import {
  AppErrorHandler,
  LostErrorHandler,
} from "./config/exceptionHandlers/handler.js";

app.use(logger);

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/banner", bannerRouter);

/* 
  4. APPLICATION ERROR HANDLING 🚔
*/
// Handle unregistered route for all HTTP Methods
app.all("*", function (req, res, next) {
  next();
});
app.use(LostErrorHandler); // 404 error handler middleware
app.use(AppErrorHandler); // General app error handler

export { app };
