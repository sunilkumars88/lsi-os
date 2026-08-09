import { ConsoleLogger, LogLevel } from '@nestjs/common';

type LogFields = Record<string, unknown>;

export class StructuredLogger extends ConsoleLogger {
  private write(level: LogLevel, message: unknown, context?: string, fields?: LogFields) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      service: 'eios-api-nest',
      context: context || this.context || 'App',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...(fields || {}),
    };
    const line = JSON.stringify(entry);
    if (level === 'error' || level === 'fatal') {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  }

  log(message: unknown, context?: string) {
    this.write('log', message, context);
  }

  error(message: unknown, stackOrContext?: string, context?: string) {
    if (context) {
      this.write('error', message, context, { stack: stackOrContext });
    } else {
      this.write('error', message, stackOrContext);
    }
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }
}
