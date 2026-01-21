const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
