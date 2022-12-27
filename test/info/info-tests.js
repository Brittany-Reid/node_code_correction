/** 
 * @fileoverview Run experiments
 */


require("mocha");
const path = require("path");
const winston = require("winston");
const { getBaseDirectory } = require("../../src/common");

// directories
const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "info");

// create logger
const logger = winston.createLogger();
logger.add(
    new winston.transports.File({
        filename: path.join(
            INFO_LOG_DIR,
            "info" + new Date().toISOString() + ".log"
        ),
        level: "info",
        format: winston.format.printf(({level, message})=>{
            return `${message}`
        }),
        options:{
            flags: "w"
        }
    })
);