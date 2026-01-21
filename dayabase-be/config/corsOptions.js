const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all if ALLOWED_ORIGINS is * or not set (for dev/default)
    if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Enable if using cookies/sessions
};

module.exports = corsOptions;
