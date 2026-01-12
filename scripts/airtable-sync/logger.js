/**
 * Logger utility for Airtable sync scripts
 * 
 * Provides structured logging with different levels and formats
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.format = options.format || 'text';
    this.logDir = options.logDir || path.join(__dirname, '../../logs/airtable-sync');
    this.logFile = options.logFile || `sync-${new Date().toISOString().split('T')[0]}.log`;
    
    // Create log directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  /**
   * Get current log level numeric value
   */
  getCurrentLevel() {
    return this.levels[this.level] || 2;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    
    if (this.format === 'json') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    }
    
    // Text format
    const metaStr = Object.keys(meta).length > 0 
      ? ` ${JSON.stringify(meta)}`
      : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  /**
   * Write log to file
   */
  writeToFile(formattedMessage) {
    const logPath = path.join(this.logDir, this.logFile);
    fs.appendFileSync(logPath, formattedMessage + '\n');
  }

  /**
   * Log message with specified level
   */
  log(level, message, meta = {}) {
    if (this.levels[level] > this.getCurrentLevel()) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[level]}${formattedMessage}${reset}`);
    
    // Write to file
    this.writeToFile(formattedMessage);
  }

  /**
   * Log error
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log sync start
   */
  syncStart(syncType, config = {}) {
    this.info(`Starting ${syncType} sync`, {
      syncType,
      ...config,
    });
  }

  /**
   * Log sync complete
   */
  syncComplete(syncType, stats = {}) {
    this.info(`Completed ${syncType} sync`, {
      syncType,
      ...stats,
    });
  }

  /**
   * Log sync error
   */
  syncError(syncType, error) {
    this.error(`Failed ${syncType} sync`, {
      syncType,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Log batch progress
   */
  batchProgress(current, total, syncType) {
    const percentage = ((current / total) * 100).toFixed(1);
    this.info(`Sync progress: ${current}/${total} (${percentage}%)`, {
      syncType,
      current,
      total,
      percentage,
    });
  }

  /**
   * Log API request
   */
  apiRequest(method, url, status) {
    this.debug(`API ${method} ${url}`, {
      method,
      url,
      status,
    });
  }

  /**
   * Log API error
   */
  apiError(method, url, error) {
    this.error(`API ${method} ${url} failed`, {
      method,
      url,
      error: error.message,
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context = {}) {
    const childLogger = new Logger({
      level: this.level,
      format: this.format,
      logDir: this.logDir,
      logFile: this.logFile,
    });
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, meta = {}) => {
      originalLog(level, message, { ...context, ...meta });
    };
    
    return childLogger;
  }
}

// Export singleton instance
module.exports = new Logger();

// Export Logger class for custom instances
module.exports.Logger = Logger;
