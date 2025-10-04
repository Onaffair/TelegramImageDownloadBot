import logger from './utils/logger.js';

process.on('uncaughtException', (err) => {
   logger.error(err)
});

