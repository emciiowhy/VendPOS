import config from '../config/env.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const getTimestamp = () => {
  return new Date().toISOString();
};

class Logger {
  info(message, data = null) {
    console.log(
      `${colors.cyan}[INFO]${colors.reset} ${getTimestamp()} - ${message}`,
      data ? data : ''
    );
  }

  success(message, data = null) {
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} ${getTimestamp()} - ${message}`,
      data ? data : ''
    );
  }

  warn(message, data = null) {
    console.warn(
      `${colors.yellow}[WARN]${colors.reset} ${getTimestamp()} - ${message}`,
      data ? data : ''
    );
  }

  error(message, error = null) {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${getTimestamp()} - ${message}`
    );
    if (error) {
      console.error(error);
    }
  }

  debug(message, data = null) {
    if (config.nodeEnv === 'development') {
      console.log(
        `${colors.magenta}[DEBUG]${colors.reset} ${getTimestamp()} - ${message}`,
        data ? data : ''
      );
    }
  }

  http(method, url, statusCode, responseTime) {
    const statusColor = statusCode >= 500 ? colors.red :
                       statusCode >= 400 ? colors.yellow :
                       statusCode >= 300 ? colors.cyan :
                       colors.green;
    
    console.log(
      `${colors.blue}[HTTP]${colors.reset} ${getTimestamp()} - ` +
      `${method} ${url} ${statusColor}${statusCode}${colors.reset} - ${responseTime}ms`
    );
  }
}

export default new Logger();