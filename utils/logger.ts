/**
 * Structured logging utility for Family Planner
 * Provides consistent logging with levels, context, and easy production control
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enabledInProduction: boolean;
  includeTimestamp: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#6B7280', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // amber
  error: '#EF4444'  // red
};

const LOG_LEVEL_EMOJIS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨'
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enabledInProduction: false,
      includeTimestamp: true,
      ...config
    };
  }

  /**
   * Check if logging should occur based on environment and level
   */
  private shouldLog(level: LogLevel): boolean {
    // In production, only log if explicitly enabled or if it's a warn/error
    if (process.env.NODE_ENV === 'production') {
      if (!this.config.enabledInProduction && LOG_LEVELS[level] < LOG_LEVELS.warn) {
        return false;
      }
    }

    // Check if level meets minimum threshold
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Format the log message with timestamp, level, and context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    parts.push(`${LOG_LEVEL_EMOJIS[level]} [${level.toUpperCase()}]`);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);
    const color = LOG_LEVEL_COLORS[level];

    // Choose appropriate console method
    const consoleMethod = level === 'error' ? console.error :
                         level === 'warn' ? console.warn :
                         console.log;

    // Log with styling in development
    if (process.env.NODE_ENV !== 'production') {
      consoleMethod(
        `%c${formattedMessage}`,
        `color: ${color}; font-weight: bold;`
      );

      // Log context if provided
      if (context && Object.keys(context).length > 0) {
        console.log('Context:', context);
      }

      // Log error stack if provided
      if (error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          ...context
        });
      }
    } else {
      // Simple logging in production
      consoleMethod(formattedMessage);

      if (context || error) {
        consoleMethod({
          context,
          error: error ? {
            message: error.message,
            stack: error.stack
          } : undefined
        });
      }
    }

    // TODO: Send errors to error tracking service (Sentry, etc.)
    if (level === 'error' && error) {
      // Future: window.Sentry?.captureException(error, { contexts: { custom: context } });
    }
  }

  /**
   * Debug level logging - verbose information for debugging
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Info level logging - general informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning level logging - potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error level logging - error events that might still allow the app to continue
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Create a child logger with additional context that will be included in all logs
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, childContext?: LogContext, error?: Error) => {
      originalLog(level, message, { ...context, ...childContext }, error);
    };

    return childLogger;
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for creating child loggers
export const createLogger = (context: LogContext): Logger => {
  return logger.child(context);
};

// Convenience exports for common use cases
export const authLogger = createLogger({ module: 'auth' });
export const dataLogger = createLogger({ module: 'data' });
export const syncLogger = createLogger({ module: 'sync' });
export const uiLogger = createLogger({ module: 'ui' });

export default logger;
