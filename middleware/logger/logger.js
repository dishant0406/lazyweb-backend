// logger.js
import chalk from 'chalk';

export const logger = (req, res, next) => {
  const hasBearerToken = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
  const accessLabel = hasBearerToken ? 'PRIVATE' : 'PUBLIC';
  let logOutput = `${req.method} ${req.originalUrl} ${accessLabel}`;

  switch (req.method) {
    case 'GET':
      logOutput = chalk.green.bold(logOutput);
      break;
    case 'POST':
      logOutput = chalk.red.bold(logOutput);
      break;
    case 'PUT':
      logOutput = chalk.blue.bold(logOutput);
      break;
    case 'DELETE':
      logOutput = chalk.yellow.bold(logOutput);
      break;
    default:
      logOutput = chalk.white.bold(logOutput);
      break;
  }

  console.log(logOutput);
  next();
};
