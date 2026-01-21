require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorMiddleware");
const limiter = require("./middleware/limiter");
const corsOptions = require("./config/corsOptions");
const router = require("./routes");

const app = express();
const port = process.env.PORT || 4013;

app.use(helmet());

// HTTP Request Logging
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", router);

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Example app listening on http://localhost:${port}`);
});
