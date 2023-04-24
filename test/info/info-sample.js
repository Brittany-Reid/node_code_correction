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
const SAMPLE_PATH = path.join(BASE, "data/NPMsample384.json");
const EXAMPLE_PATH = path.join(BASE, "data/examples/384sampleExamples.json");

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
var packages = [];
var snippets = [];

var temp = [];

var examples = {}

async function loadData(recordLimit){
    var i = 0;
    var sid = 0;
    const onData = (data, pipeline) => {

        if(typeof recordLimit === "number" && i > recordLimit){
            pipeline.destroy();
            return;
        }

        var snippetArray = JSON.parse(data.snippets)

        temp.push(...snippetArray)
        if(i % 1000 == 0) console.log(temp.length)
        i++;
    };


    //create a fixed sample
    if (!fs.existsSync(SAMPLE_PATH)){
        await readCSVStream(DATA_PATH, onData);
        temp = _.sampleSize(temp, 384)
        fs.writeFileSync(SAMPLE_PATH,  JSON.stringify(temp), {encoding:"utf-8"})
    }
    else{
        temp = JSON.parse(fs.readFileSync(SAMPLE_PATH, {encoding:"utf-8"}))
    }
    var sid = 0;
    for(var t of temp){
        var snippetObject = new Snippet(t, sid);
        snippets.push(snippetObject);
        idToSnippet.set(sid, snippetObject);
        sid++;
    }

}

describe("Dataset Info (takes time to load)", function () {
    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        await loadData();
    });

    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })
    it("Should tell us error statistics", async function(){
        logger.info("--------");
        logger.info("ERROR ANALYSIS\n");
        var compiler = new Compiler();
        examples["Error Analysis"] = await getErrorsFor(snippets, compiler.compile.bind(compiler), logger, (s) => {return s.code})
        compiler.close();
    }).timeout(0);
    it("Should tell us line deletion stats", async function(){
        logger.info("--------");
        logger.info("DELETION ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.customFixes = false;
        fixer.tsFixes = false;
        fixer.deletions = true;
        examples["After Deletion"] = await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s)
        compiler.close()
    }).timeout(0);
    it("Should tell us TS fix stats", async function(){
        logger.info("--------");
        logger.info("TS FIX ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.customFixes = false;
        fixer.tsFixes = true;
        fixer.deletions = false;
        examples["After TS Fixes"] = await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s)
        compiler.close()
    }).timeout(0);
    it("Should tell us custom fix stats", async function(){
        logger.info("--------");
        logger.info("CUSTOM FIX ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.customFixes = true;
        fixer.tsFixes = false;
        fixer.deletions = false;
        examples["After Custom Fixes"] = await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s)
        compiler.close()
    }).timeout(0);
    it("Should tell us TSFix+Deletion stats", async function(){
        logger.info("--------");
        logger.info("TS DELETE ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.customFixes = false;
        fixer.tsFixes = true;
        fixer.deletions = true;
        examples["After TS+Delete"] = await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s)
        compiler.close()
    }).timeout(0);
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

    this.afterAll(()=>{
        fs.writeFileSync(EXAMPLE_PATH, JSON.stringify(examples, undefined, 1), {encoding:"utf-8"})
    })
});