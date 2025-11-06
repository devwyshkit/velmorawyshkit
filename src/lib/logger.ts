/**
 * Structured Logging Service - Swiggy 2025 Pattern
 * 
 * Replaces console statements with structured logging
 * Production: Silent or send to monitoring service
 * Development: Console output with structured format
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors and warnings
    if (this.isProduction) {
      return level === 'error' || level === 'warn';
    }
    // In development, log everything
    return this.isDevelopment;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
    // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = error instanceof Error 
        ? { ...context, error: { message: error.message, stack: error.stack } }
        : { ...context, error };
      console.error(this.formatMessage('error', message, errorContext));
    }
    // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
  }
}

export const logger = new Logger();

