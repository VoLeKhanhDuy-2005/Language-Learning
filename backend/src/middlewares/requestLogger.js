import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '..', '..', 'logs');

fs.mkdirSync(logDir, { recursive: true });

const padDatePart = (value, length = 2) => String(value).padStart(length, '0');

const getLocalDate = (date = new Date()) =>
  [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');

const getTimezoneOffset = (date) => {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offset);
  const hours = Math.floor(absoluteOffset / 60);
  const minutes = absoluteOffset % 60;

  return `${sign}${padDatePart(hours)}:${padDatePart(minutes)}`;
};

const getTimestamp = () => {
  const date = new Date();
  const time = [
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join(':');
  const milliseconds = padDatePart(date.getMilliseconds(), 3);

  return `${getLocalDate(date)}T${time}.${milliseconds}${getTimezoneOffset(date)}`;
};

const getLogFilePath = () => path.join(logDir, `${getLocalDate()}.log`);

const sanitizeLogValue = (value) =>
  String(value ?? '-').replace(/[\r\n|]+/g, ' ');

const getLogLevel = (status) => {
  const statusCode = Number(status);

  if (statusCode >= 500) return 'ERROR';
  if (statusCode >= 400) return 'WARN';
  return 'INFO';
};

morgan.token('timestamp', () => getTimestamp());
morgan.token('level', (req, res) => getLogLevel(res.statusCode));
morgan.token('endpoint', (req) => req.originalUrl || req.url);
morgan.token(
  'responseSize',
  (req, res) => res.getHeader('content-length') || '-'
);
morgan.token('ip', (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  return Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim() || req.socket.remoteAddress || req.ip;
});
morgan.token('userAgent', (req) => req.headers['user-agent'] || '-');
morgan.token(
  'referer',
  (req) => req.headers.referer || req.headers.referrer || '-'
);
morgan.token('userEmail', (req) => req.user?.email || '-');
morgan.token('errorName', (req, res) => res.locals.error?.name || '-');
morgan.token('errorMessage', (req, res) => res.locals.error?.message || '-');
morgan.token('stack', (req, res) => {
  const status = Number(res.statusCode);

  if (status < 500) return '-';

  return res.locals.error?.stack || '-';
});

const logFormat = (tokens, req, res) =>
  [
    tokens.timestamp(req, res),
    tokens.level(req, res),
    tokens.method(req, res),
    tokens.endpoint(req, res),
    tokens.status(req, res),
    tokens.responseSize(req, res),
    `${tokens['response-time'](req, res)} ms`,
    tokens.ip(req, res),
    tokens.userEmail(req, res),
    tokens.userAgent(req, res),
    tokens.referer(req, res),
    tokens.errorName(req, res),
    tokens.errorMessage(req, res),
    tokens.stack(req, res),
  ]
    .map(sanitizeLogValue)
    .join(' | ');

const dailyLogStream = {
  write: (message) => {
    fs.appendFile(getLogFilePath(), message, (error) => {
      if (error) {
        console.error('Failed to write access log:', error);
      }
    });
  },
};

export default morgan(logFormat, { stream: dailyLogStream });
