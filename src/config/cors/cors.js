const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3085",
  "https://sundarbanhoneybd.com",
  "https://www.sundarbanhoneybd.com",
];

const corsOptions = {
  origin: function (origin, callback) {
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
