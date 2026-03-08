/**
 * Sistema centralizado de logging
 * Solo muestra logs en modo desarrollo, silencia en producción
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig = {
    enabled: import.meta.env.DEV,
    level: 'debug',
    includeTimestamp: true,
  };

  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojis[level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const emoji = this.getLevelEmoji(level);
    const timestamp = this.config.includeTimestamp
      ? `[${new Date().toLocaleTimeString()}]`
      : '';
    return `${emoji} ${timestamp} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log de debugging - solo visible en desarrollo
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
    }
  }

  /**
   * Log informativo - solo visible en desarrollo
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
    }
  }

  /**
   * Warning - visible en desarrollo
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
    }
  }

  /**
   * Error - siempre visible (incluso en producción)
   * En producción deberías enviarlo a un servicio de monitoring
   */
  error(message: string, error?: any, ...args: any[]): void {
    const formattedMessage = this.formatMessage('error', message);

    // En producción, envía a servicio de monitoring
    if (!import.meta.env.DEV) {
      // TODO: Integrar con servicio de monitoring (Sentry, LogRocket, etc.)
    } else {
    }
  }

  /**
   * Log de operaciones de base de datos
   */
  db(operation: string, table: string, details?: any): void {
    if (this.shouldLog('debug')) {
      // Logs disabled
    }
  }

  /**
   * Log de operaciones de autenticación
   */
  auth(action: string, details?: any): void {
    if (this.shouldLog('debug')) {
    }
  }

  /**
   * Log de operaciones de store (Zustand)
   */
  store(storeName: string, action: string, details?: any): void {
    if (this.shouldLog('debug')) {
      // Logs disabled
    }
  }

  /**
   * Log de API calls
   */
  api(method: string, endpoint: string, details?: any): void {
    if (this.shouldLog('debug')) {
      console.log(
        this.formatMessage('debug', `API ${method} ${endpoint}`),
        details
      );
    }
  }

  /**
   * Configurar el logger (útil para testing o debug específico)
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Grupo de logs (para agrupar logs relacionados)
   */
  group(label: string, callback: () => void): void {
    if (this.config.enabled) {
      console.group(this.formatMessage('debug', label));
      callback();
      console.groupEnd();
    }
  }

  /**
   * Medir tiempo de ejecución
   */
  time(label: string): void {
    if (this.config.enabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.config.enabled) {
      console.timeEnd(label);
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exponer en window solo en desarrollo para debugging manual
if (import.meta.env.DEV) {
  (window as any).logger = logger;
}
