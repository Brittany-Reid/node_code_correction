/** 
 * @fileoverview Run experiments on NPM snippets.
 */

require("mocha");
const _ = require("lodash");
const fs = require("fs")
const path = require("path");
const winston = require("winston");
const { getBaseDirectory, readCSVStream } = require("../../src/common");
const Compiler = require("../../src/ts/compiler/compiler");
const ErrorCounter = require("../../src/error-counter");
const Snippet = require("../../src/snippet");
const { getErrorsFor } = require("../../src/error-counter");
const Fixer = require("../../src/fixer");

// directories
const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "info");
const DATA_PATH = path.join(BASE, "data/dataset.csv");
const EXAMPLE_PATH = path.join(BASE, "data/examples/NPMAllFixesExamples.json");

// create logger
const logger = winston.createLogger();
var filename = path.join(
    INFO_LOG_DIR,
    "npm-all-fixes" + Date.now() + ".log",
);
// fs.writeFileSync(filename, "", {flag:"w"})
logger.add(
    new winston.transports.File({
        filename: filename,
        level: "info",
        format: winston.format.printf(({level, message})=>{
            return `${message}`
        }),
        options:{
            flags: "w"
        }
    })
);

var idToSnippet = new Map();
// var packages = []
var snippets = [];

var examples = {};

async function loadData(recordLimit, start=0){
    var id = 0;
    var sid = 0;
    const onData = (data, pipeline) => {

        data.snippets = JSON.parse(data.snippets);

        var name = data["name"];
        // packages.push(name);

        var pSnippets = data.snippets;
        var i = 0;
        var snippetIds = [];
        for(var s of pSnippets){
            if(typeof recordLimit === "number" && sid >= recordLimit){
                pipeline.destroy();
                return;
            }
            if(sid >= start){
                var snippetObject = new Snippet(s, sid, i, data);
                snippets.push(snippetObject);
                idToSnippet.set(sid, snippetObject);
            }
            sid++;
            i++;
        }
        id++;
    };

    await readCSVStream(DATA_PATH, onData);

}


describe("SO Edits (All) (long run time)", function () {
    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        var r = 9;
        await loadData(216191*(r), 216191*(r-1));
        // var r = 10;
        // await loadData(undefined, 216191*(r-1));
    });

    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })
    it("Should tell us all fix stats", async function(){
        logger.info("--------");
        logger.info("ALL FIXES ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.customFixes = true;
        fixer.tsFixes = true;
        fixer.deletions = true;
        examples["After All Fixes"] = await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s)
        compiler.close()
    }).timeout(0);

    // this.afterAll(()=>{
    //     fs.writeFileSync(EXAMPLE_PATH, JSON.stringify(examples, undefined, 1), {encoding:"utf-8"})
    // })
});