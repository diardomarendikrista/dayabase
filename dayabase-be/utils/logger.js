const winston = require('winston');
const path = require('path');

const transports = [
  // Always log errors to error.log
  new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
];

// Only enable combined log if explicitly requested
if (process.env.ENABLE_COMBINED_LOG === 'true') {
  transports.push(new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }));
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'dayabase-be' },
  transports: transports,
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
