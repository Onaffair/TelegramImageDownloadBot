// logger.js
const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logPath = './logs') {
        this.logPath = logPath;
        // 确保日志目录存在
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }
    }

    log(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };

        const logMessage = JSON.stringify(logEntry);
        console.log(logMessage);

        // 写入日志文件
        const logFile = path.join(this.logPath, `${new Date().toDateString().replace(/\s/g, '_')}.log`);
        fs.appendFileSync(logFile, logMessage + '\n');
    }

    error(message, error = null) {
        if (message instanceof Error && !error) {
            // 如果第一个参数就是 Error 对象
            error = message;
            message = error.message;
        }
        this.log('error', message, {
            error: error ? {
                message: error.message,
                stack: error.stack
            } : null
        });
    }

    info(message) {
        this.log('info', message);
    }

    warn(message) {
        this.log('warn', message);
    }
}

module.exports = new Logger();
