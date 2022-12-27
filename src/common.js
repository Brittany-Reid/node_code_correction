/** 
 * @fileoverview Common functionality.
 */

const path = require("path");
const parse = require("csv-parse");
const fs = require("fs");

const ROOT = "node_code_correction";

/**
 * 
 * @returns 
 */
function getBaseDirectory() {
    var base = __dirname;
    //fall back if we run from node_code_query/ncq
    if (
        path.dirname(base) != ROOT &&
    path.dirname(base) != ROOT + "/"
    ) {
        base = path.join(base, "../");
    }
    base = path.resolve(base);
    return base;
}

/**
 * Read a CSV file as stream. Returns a promise.
 */
function readCSVStream(file, onData = (data, pipeline)=>{}, onEnd = (data)=>{}, onClose = ()=>{}, options = {
    delimiter: '\t',
    relax: true,
    escape: false,
    columns:true,
}){
    const parser = parse(options);

    var pipeline = fs.createReadStream(file, {encoding: "utf-8"}).pipe(parser);

    return new Promise((resolve, reject) => {
        pipeline.on("data", (data) => {
            onData(data, pipeline);
        });
        pipeline.on("end", (data) => {
            onEnd(data);
            resolve();
        });
        pipeline.on("close", (data) =>{
            onClose();
            resolve();
        });
    });
}

module.exports = {
    getBaseDirectory,
    readCSVStream
};