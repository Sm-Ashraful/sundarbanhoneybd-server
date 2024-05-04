const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3085",
  "https://sundarbanhoneybd.com",
  "https://www.sundarbanhoneybd.com",
  "127.0.0.1", // Or your server's actual IP address
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin: ", origin);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  // exposedHeaders: ["WWW-Authenticate"],
};
export { corsOptions };
