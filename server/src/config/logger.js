import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, requestId, negotiationId, jobId, ...metadata }) => {
  let metaStr = '';
  const extra = { ...metadata };
  if (requestId) extra.requestId = requestId;
  if (negotiationId) extra.negotiationId = negotiationId;
  if (jobId) extra.jobId = jobId;
  
  if (Object.keys(extra).length > 0) {
    metaStr = ` ${JSON.stringify(extra)}`;
  }
  return `[${timestamp}] [${level}]: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), consoleFormat)
  ),
  defaultMeta: { service: 'negotiating-budget-agents' },
  transports: [
    new winston.transports.Console()
  ]
});

export default logger;
