type LoggerContext = Record<string, unknown>;

function formatMessage(
  level: string,
  message: string,
  context?: LoggerContext,
) {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  info(message: string, context?: LoggerContext) {
    console.info(formatMessage("info", message, context));
  },
  warn(message: string, context?: LoggerContext) {
    console.warn(formatMessage("warn", message, context));
  },
  error(message: string, context?: LoggerContext) {
    console.error(formatMessage("error", message, context));
  },
};
