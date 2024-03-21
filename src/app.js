import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const allowedOrigins = [
  "http://localhost:3000",
  "https://sundarbanhoneybd.com",
  "https://www.sundarbanhoneybd.com",
];

const corsOptions = {
  origin: allowedOrigins,
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
import { logger } from "./middlewares/logger.js";

app.use(logger);

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/profile", profileRouter);

export { app };
