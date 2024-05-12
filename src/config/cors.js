const allowlist = [
  "http://localhost:3000",
  "http://localhost:3085",
  "https://sundarbanhoneybd.com",
  "https://www.sundarbanhoneybd.com",
  "https://sundarbanhoneybd.com/api",
];
const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin option: ", origin);
    if (allowlist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  // exposedHeaders: ["WWW-Authenticate"],
};

export { corsOptions };
