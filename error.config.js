const logger = require('./utils/logger')

process.on('uncaughtException', (err) => {
   logger.error(err)
});

