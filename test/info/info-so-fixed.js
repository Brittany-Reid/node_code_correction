/** 
 * @fileoverview Run experiments on SO Code Blocks for only those with improvement.
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
const DATA_PATH = path.join(BASE, "data/soFixesFixed.json");
const EXAMPLE_PATH = path.join(BASE, "data/examples/SOExamples-fixed.json");

// create logger
const logger = winston.createLogger();
var filename = path.join(
    INFO_LOG_DIR,
    "soFixed" + Date.now() + ".log",
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


var examples = {before:{}, after:{}};

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


describe("SO Edits (Fixed) (long run time)", function () {
    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        await loadData();
    });

    describe("Before Edits", function () {
        it("Should tell us how many snippets", function (){
            logger.info("TOTAL SNIPPETS: " + snippetsBefore.length);
        })
        it("Should tell us error statistics", async function(){
            logger.info("--------");
            logger.info("ERROR ANALYSIS\n");
            var compiler = new Compiler();
            examples["before"]["Error Analysis"] = await getErrorsFor(snippetsBefore, compiler.compile.bind(compiler), logger, (s) => {return s.code})
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
            examples["before"]["After Deletion"] =  await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s)
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
            examples["before"]["After TS Fixes"] = await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s)
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
            examples["before"]["After Custom Fixes"] = await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s)
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
            examples["before"]["After TS+Delete"] = await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s)
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
            examples["before"]["After Custom+TS"] = await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s)
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
            examples["before"]["After All Fixes"] = await getErrorsFor(snippetsBefore, fixer.fix.bind(fixer), logger, s => s)
            compiler.close()
        }).timeout(0);
    });

    describe("After Edits", function () {
        it("Should tell us how many snippets", function (){
            logger.info("DATASET INFORMATION:")
            logger.info("TOTAL SNIPPETS: " + snippetsAfter.length);
        })
        it("Should tell us error statistics", async function(){
            logger.info("--------");
            logger.info("ERROR ANALYSIS\n");
            var compiler = new Compiler();
            examples["after"]["Error Analysis"] = await getErrorsFor(snippetsAfter, compiler.compile.bind(compiler), logger, (s) => {return s.code})
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
            examples["after"]["After Deletion"] =  await getErrorsFor(snippetsAfter, fixer.fix.bind(fixer), logger, s => s)
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
            examples["after"]["After TS Fixes"] = await getErrorsFor(snippetsAfter, fixer.fix.bind(fixer), logger, s => s)
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
            examples["after"]["After Custom Fixes"] = await getErrorsFor(snippetsAfter, fixer.fix.bind(fixer), logger, s => s)
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
            examples["after"]["After TS+Delete"] = await getErrorsFor(snippetsAfter, fixer.fix.bind(fixer), logger, s => s)
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
            examples["after"]["After Custom+TS"] = await getErrorsFor(snippetsAfter,fixer.fix.bind(fixer), logger, s => s)
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
            examples["after"]["After All Fixes"] = await getErrorsFor(snippetsAfter,fixer.fix.bind(fixer), logger, s => s)
            compiler.close()
        }).timeout(0);
    });


    this.afterAll(()=>{
        fs.writeFileSync(EXAMPLE_PATH, JSON.stringify(examples, undefined, 1), {encoding:"utf-8"})
    })
});