/** 
 * @fileoverview Run experiments on SO Code Blocks
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
const DATA_PATH = path.join(BASE, "data/soFixes.json");

// create logger
const logger = winston.createLogger();
var filename = path.join(
    INFO_LOG_DIR,
    "so" + Date.now() + ".log",
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
var snippetsBefore = [];
var snippetsAfter = [];

async function loadData(recordLimit){
    var data = fs.readFileSync(DATA_PATH, {encoding: "utf-8"});
    data = JSON.parse(data);
    var id = 0;

    for(var d of data){
        var versions = d["Versions"];
        var s1 = new Snippet(versions[0]["Content"], id)
        snippetsBefore.push(s1)
        idToSnippet.set(id, s1)
        id++
        var s2 = new Snippet(versions[1]["Content"], id)
        snippetsAfter.push(s2)
        idToSnippet.set(id, s2)
        id++;
    }
}


describe("SO Errors (long run time)", function () {
    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        await loadData();
    });
    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippetsBefore.length);
    })
    it("Should tell us parsing error statistics for the original set", async function(){
        logger.info("--------");
        logger.info("ERROR ANALYSIS\n");
        var compiler = new Compiler();
        await getErrorsFor(snippetsBefore, compiler.compile.bind(compiler), logger, (s) => {return s.code}, BASE + "/errorExamples.json")
        compiler.close();
    }).timeout(0);
    it("Should tell us line deletion stats", async function(){
        logger.info("--------");
        logger.info("DELETION ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = false;
        fixer.deletions = true;
        await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s, BASE + "/postDeleteSample.json")
        compiler.close()
    }).timeout(0);
    it("Should tell us TS fix stats", async function(){
        logger.info("--------");
        logger.info("TS FIX ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = true;
        fixer.deletions = false;
        await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s, BASE + "/postTSFixSample.json")
        compiler.close()
    }).timeout(0);
    it("Should tell us all fix stats", async function(){
        logger.info("--------");
        logger.info("ALL FIXES ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = true;
        fixer.deletions = true;
        await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s, BASE + "/postAllSample.json")
        compiler.close()
    }).timeout(0);

    it("Should tell us how many snippets", function (){
        logger.info("DATASET INFORMATION:")
        logger.info("TOTAL SNIPPETS: " + snippetsAfter.length);
    })
    it("Should tell us parsing error statistics for the fixed set", async function(){
        logger.info("--------");
        logger.info("ERROR ANALYSIS\n");
        var compiler = new Compiler();
        await getErrorsFor(snippetsAfter, compiler.compile.bind(compiler), logger, (s) => {return s.code}, BASE + "/errorExamples2.json")
        compiler.close();
    }).timeout(0);
    it("Should tell us line deletion stats", async function(){
        logger.info("--------");
        logger.info("DELETION ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = false;
        fixer.deletions = true;
        await getErrorsFor(snippetsAfter, fixer.fix.bind(fixer), logger, s => s, BASE + "/postDeleteSample2.json")
        compiler.close()
    }).timeout(0);
    it("Should tell us TS fix stats", async function(){
        logger.info("--------");
        logger.info("TS FIX ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = true;
        fixer.deletions = false;
        await getErrorsFor(snippetsAfter, fixer.fix.bind(fixer), logger, s => s, BASE + "/postTSFixSample2.json")
        compiler.close()
    }).timeout(0);
    it("Should tell us all fix stats", async function(){
        logger.info("--------");
        logger.info("ALL FIXES ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        fixer.tsFixes = true;
        fixer.deletions = true;
        await getErrorsFor(snippetsAfter, fixer.fix.bind(fixer), logger, s => s, BASE + "/postAllSample2.json")
        compiler.close()
    }).timeout(0);
});