/**
 * Application Logger
 * Native lightweight console logger with timestamps and log levels.
 */

const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  return [`[${timestamp}] ${level.toUpperCase()}:`, message, ...args];
};

const logger = {
  info: (message, ...args) => {
    console.log(...formatMessage('info', message, ...args));
  },
  warn: (message, ...args) => {
    console.warn(...formatMessage('warn', message, ...args));
  },
  error: (message, ...args) => {
    console.error(...formatMessage('error', message, ...args));
  },
  debug: (message, ...args) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(...formatMessage('debug', message, ...args));
    }
  },
};

export default logger;


