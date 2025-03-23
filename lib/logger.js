const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE_PATH = path.join(LOGS_DIR, 'log.txt');

function ensureLogsDirectoryExists() {
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
        console.log(`Created logs directory at ${LOGS_DIR}`);
    }
}

function log(message, isError = false) {
    ensureLogsDirectoryExists();

    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}]`;
    const logMessage = `${logPrefix} ${isError ? 'ERROR: ' : ''}${message}`;

    if (isError) {
        console.error(logMessage);
    } else {
        console.log(logMessage);
    }

    try {
        fs.appendFileSync(LOG_FILE_PATH, logMessage + '\n');
    } catch (err) {
        console.error(`Failed to write to log file: ${err.message}`);
    }
}

module.exports = { log };
