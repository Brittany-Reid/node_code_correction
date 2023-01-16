/** 
 * @fileoverview Run experiments over a random sample of 384 snippets.
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
const Fixer = require("../../src/fixer");
const { getErrorsFor } = require("../../src/error-counter");

// directories
const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "sample");
const DATA_PATH = path.join(BASE, "data/dataset.csv");

// create logger
const logger = winston.createLogger();
var filename = path.join(
    INFO_LOG_DIR,
    "sample" + Date.now() + ".log",
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
var packages = []
var snippets = []

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
        packages.push(name);

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

describe("Dataset Info (takes time to load)", function () {
    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        await loadData(50);
        // snippets = _.sampleSize(snippets, 384)//do a sample
    });

    it("Should tell us how many packages", function (){
        logger.info("TOTAL PACKAGES: " + packages.length);
    })
    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })
    it("Should tell us error statistics", async function(){
        logger.info("--------");
        logger.info("ERROR ANALYSIS\n");
        var compiler = new Compiler();
        await getErrorsFor(snippets, compiler.compile.bind(compiler), logger, (s) => {return s.code}, BASE + "/errorExamplesSample.json")
        compiler.close();
    }).timeout(0);
    it("Should tell us line deletion stats", async function(){
        logger.info("--------");
        logger.info("DELETION ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = false;
        fixer.deletions = true;
        await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s, BASE + "/postDeleteSample.json")
        compiler.close()
    }).timeout(0);
    it("Should tell us TS fix stats", async function(){
        logger.info("--------");
        logger.info("TS FIX ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = true;
        fixer.deletions = false;
        await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s, BASE + "/postTSFixSample.json")
        compiler.close()
    }).timeout(0);
    it("Should tell us all fix stats", async function(){
        logger.info("--------");
        logger.info("ALL FIXES ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = true;
        fixer.deletions = true;
        await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s, BASE + "/postAllSample.json")
        compiler.close()
    }).timeout(0);
});