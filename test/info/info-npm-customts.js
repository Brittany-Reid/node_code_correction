/** 
 * @fileoverview Run experiments on NPM snippets.
 * For 2m snippets these should be run from the individual files.
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
const EXAMPLE_PATH = path.join(BASE, "data/examples/NPMCustomTSExamples.json");

// create logger
const logger = winston.createLogger();
var filename = path.join(
    INFO_LOG_DIR,
    "npm-customts" + Date.now() + ".log",
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

async function loadData(recordLimit){
    var id = 0;
    var sid = 0;
    const onData = (data, pipeline) => {
        if(typeof recordLimit === "number" && id > recordLimit){
            pipeline.destroy();
            return;
        }

        data.snippets = JSON.parse(data.snippets);

        var name = data["name"];
        // packages.push(name);

        var pSnippets = data.snippets;
        var i = 0;
        var snippetIds = [];
        for(var s of pSnippets){
        var snippetObject = new Snippet(s, sid, i, data);
            snippets.push(snippetObject);
            idToSnippet.set(sid, snippetObject);
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
        await loadData();
    });

    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })
    it("Should tell us Custom+TSFix stats", async function(){
        logger.info("--------");
        logger.info("CUSTOM FIX TS ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.customFixes = true;
        fixer.tsFixes = true;
        fixer.deletions = false;
        examples["After Custom+TS"] = await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s)
        compiler.close()
    }).timeout(0);
    

    // this.afterAll(()=>{
    //     fs.writeFileSync(EXAMPLE_PATH, JSON.stringify(examples, undefined, 1), {encoding:"utf-8"})
    // })
});