import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    // Initialize express-session middleware

    // Error handling for the app
    app.on("error", (err) => {
      console.log(`Server Crashed due to ${err.message}`);
    });

    // Start the server
    app.listen(process.env.PORT || 3085, () => {
      console.log(`Server is running on port ${process.env.PORT || 3085}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB connection failed: ${err.message}`);
  });

// Middleware to log session details
