import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
  userId?: string;
  requestId?: string;
}

/**
 * Logger service for structured logging
 */
export class LoggerService {
  private static instance: LoggerService;
  private logDir: string;
  private enableFileLogging: boolean;

  private constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.enableFileLogging = process.env['ENABLE_FILE_LOGGING'] === 'true';

    // Create logs directory if it doesn't exist
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private writeToFile(level: LogLevel, content: string): void {
    if (!this.enableFileLogging) return;

    const date = new Date().toISOString().split('T')[0];
    const filename = `${level.toLowerCase()}-${date}.log`;
    const filepath = path.join(this.logDir, filename);

    fs.appendFileSync(filepath, content + '\n', 'utf8');
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    };

    const formattedLog = this.formatLog(entry);

    // Console output
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        if (process.env['NODE_ENV'] === 'development') {
          console.debug(formattedLog);
        }
        break;
    }

    // File output
    this.writeToFile(level, formattedLog);
  }

  public error(message: string, error?: Error | any, meta?: any): void {
    this.log(LogLevel.ERROR, message, {
      ...meta,
      error: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
  }

  public warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  public info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log HTTP request
   */
  public logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string
  ): void {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      userId,
      requestId,
    });
  }

  /**
   * Log database operation
   */
  public logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: Error
  ): void {
    if (success) {
      this.debug('Database operation', {
        operation,
        table,
        duration: `${duration}ms`,
      });
    } else {
      this.error('Database operation failed', error, {
        operation,
        table,
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Log external service call
   */
  public logExternalService(
    service: string,
    operation: string,
    duration: number,
    success: boolean,
    error?: Error
  ): void {
    if (success) {
      this.info('External service call', {
        service,
        operation,
        duration: `${duration}ms`,
      });
    } else {
      this.error('External service call failed', error, {
        service,
        operation,
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Log security event
   */
  public logSecurityEvent(
    event: string,
    userId?: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    this.warn('Security event', {
      event,
      userId,
      severity,
      ...details,
    });
  }
}

// Export singleton instance
export const logger = LoggerService.getInstance();
