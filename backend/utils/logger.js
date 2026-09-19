/**
 * Winston Logging Module
 * Configures application logging directly to the console with timestamps, colors, and formatted stack traces.
 */

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `[${timestamp}] ${level}: ${message}\n${stack}`;
      }
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  defaultMeta: { service: "swift-api" },
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;

