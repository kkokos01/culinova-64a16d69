/**
 * Structured logging utility for Culinova app
 * Environment-aware with different log levels
 */

export type LogContext = string;

export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for detailed data flow and troubleshooting
   */
  debug: (message: string, data?: any, context?: LogContext) => {
    if (import.meta.env.DEV) {
      const contextPrefix = context ? `[${context}] ` : '';
      console.log(`🔍 DEBUG: ${contextPrefix}${message}`, data || '');
    }
  },

  /**
   * Info logs - only shown in development
   * Use for general information and state changes
   */
  info: (message: string, data?: any, context?: LogContext) => {
    if (import.meta.env.DEV) {
      const contextPrefix = context ? `[${context}] ` : '';
      console.info(`ℹ️ INFO: ${contextPrefix}${message}`, data || '');
    }
  },

  /**
   * Warning logs - shown in all environments
   * Use for potential issues that don't break functionality
   */
  warn: (message: string, data?: any, context?: LogContext) => {
    const contextPrefix = context ? `[${context}] ` : '';
    console.warn(`⚠️ WARN: ${contextPrefix}${message}`, data || '');
  },

  /**
   * Error logs - always shown in all environments
   * Use for actual errors and problems
   */
  error: (message: string, error?: any, context?: LogContext) => {
    const contextPrefix = context ? `[${context}] ` : '';
    console.error(`❌ ERROR: ${contextPrefix}${message}`, error || '');
  },

  /**
   * Performance timing helper - development only
   * Use for measuring operation performance
   */
  time: (label: string, context?: LogContext) => {
    if (import.meta.env.DEV) {
      const contextPrefix = context ? `[${context}] ` : '';
      console.time(`⏱️ TIME: ${contextPrefix}${label}`);
    }
  },

  timeEnd: (label: string, context?: LogContext) => {
    if (import.meta.env.DEV) {
      const contextPrefix = context ? `[${context}] ` : '';
      console.timeEnd(`⏱️ TIME: ${contextPrefix}${label}`);
    }
  }
};

/**
 * Convenience method for component-specific logging
 */
export const createLogger = (context: LogContext) => ({
  debug: (message: string, data?: any) => logger.debug(message, data, context),
  info: (message: string, data?: any) => logger.info(message, data, context),
  warn: (message: string, data?: any) => logger.warn(message, data, context),
  error: (message: string, error?: any) => logger.error(message, error, context),
  time: (label: string) => logger.time(label, context),
  timeEnd: (label: string) => logger.timeEnd(label, context),
});
