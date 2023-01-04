/**
 * @fileoverview runs ESLint experiments on a random sample of 384 snippets.
 * This is the approach from NCQ.
 */

require("mocha");
const _ = require("lodash");
const fs = require("fs")
const path = require("path");
const winston = require("winston");
const { getBaseDirectory, readCSVStream } = require("../../src/common");
const Compiler = require("../../src/compiler/compiler");
const ErrorCounter = require("../../src/error-counter");
const Snippet = require("../../src/snippet");
const LinterHandler = require("../../src/ncq/linter-handler");
const Fixer = require("../../src/ncq/fixer");
const { hasCode } = require("../../src/fixer");

// directories
const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "eslint");
const DATA_PATH = path.join(BASE, "data/dataset.csv");

// create logger
const logger = winston.createLogger();
var filename = path.join(
    INFO_LOG_DIR,
    "eslint" + Date.now() + ".log",
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

function addToErrorData(errors, id, object){
    for(var e of errors){
        var rule = e.ruleId;
        if(!rule){
            if(e.message.startsWith("Parsing error: Unexpected token")){
                rule = "Parsing error: Unexpected token";
            }
            else if(e.message.startsWith("Parsing error: Unexpected character")){
                rule = "Parsing error: Unexpected character";
            }
            else if(e.message.startsWith("Parsing error: Identifier") && e.message.endsWith("has already been declared")){
                rule = "Parsing error: Identifier has already been declared";
            }
            else if(e.message.startsWith("Parsing error: Label") && e.message.endsWith("is already declared")){
                rule = "Parsing error: Label is already declared";
            }
            else if(e.message.startsWith("Parsing error: Invalid regular expression")){
                rule = "Parsing error: Invalid regular expression";
            }
            else if(e.message.startsWith("Parsing error: The keyword") && e.message.endsWith("is reserved")){
                rule = "Parsing error: Reserved keyword"
            }
            else{
                rule = e.message;
            }
        }
        var data = object[rule];
        if(!data) data = {
            occurances: 0,
            affectedSnippets: new Set(),
            fatal: undefined,
        }
        data.fatal = e.fatal;
        data.severity = e.severity;
        data.occurances++;
        data.affectedSnippets.add(id);
        object[rule] = data;
    }
}

function getErrorsFor(snippets, fn, sn, en){
    var linter = new LinterHandler();
    var errorData = {};
    var nondeletedLines = 0;
    var totalErrors = 0;
    var totalWarnOrErrors = 0;
    var noErrors = 0;
    var noWarnOrErrors = 0;
    var noLines = 0;
    var fixed = 0;
    var i = 0;
    var length = snippets.length;
    for(var s of snippets){
        var errors = []
        var noWarnings = [];
        if(sn){
            errors = fn(sn(s));
        }
        else{
            s = fn(s)
            s.errors = linter.lint(s.code);
            errors = s.errors
            if(s.fixed) fixed++;
        }
        //record errors
        if(en){
            noWarnings = LinterHandler.errors(errors);
            if(errors.length < 1) noWarnOrErrors++;
            if(noWarnings.length < 1) noErrors++;
            totalErrors+=noWarnings.length;
            totalWarnOrErrors+=errors.length;
        }
        else{
            if(errors.length < 1) noErrors++;
            totalErrors+=errors.length;
        }
        addToErrorData(errors, s.id, errorData);
        //record has lines
        s = hasCode(s)
        if(!s.hasCode){
            noLines++
        }
        //record lines
        if(s.nondeletedLines !== undefined) nondeletedLines += s.nondeletedLines;
    }

    var keys = Object.keys(errorData);
    keys.sort((a, b)=>{
        var aValue = errorData[a].occurances;
        var bValue = errorData[b].occurances;
        return bValue - aValue;
    })
    logger.info("ERROR, CODE, CATEGORY, NUM OCCURANCES, NUM AFFECTED SNIPPETS, FIRST ID, PERCENT, FATAL")
    for(var k of keys){
        var e = errorData[k];
        logger.info(k + ",, " + e.severity + ", "+ e.occurances + ", " + e.affectedSnippets.size + ",, " + (errorData[k].affectedSnippets.size/snippets.length) + ", "+ e.fatal)
    }
    logger.info("");
    logger.info("Total errors: " + totalErrors)
    if(en) logger.info("Total warnings or errors: " + totalWarnOrErrors)
    logger.info("Snippets without errors: " + noErrors + "/" + length + "(" + (noErrors/length) +")")
    if(en) logger.info("Snippets without errors or warnings: " + noWarnOrErrors + "/" + length + "(" + (noWarnOrErrors/length) +")")
    logger.info("Fixed: " + fixed + "/" + length + "(" + (fixed/length) +")")
    logger.info("Snippets no lines: " + noLines + "/" + length + "(" + (noLines/length) +")")
    logger.info("Code lines: " + nondeletedLines)
}

describe("Dataset Info (takes time to load)", function () {
    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        await loadData();
        //snippets = _.sampleSize(snippets, 384)//do a sample
    });

    it("Should tell us how many packages", function (){
        logger.info("TOTAL PACKAGES: " + packages.length);
    })
    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })
    it("Should tell us parsing error statistics", async function(){
        logger.info("--------");
        logger.info("PARSING ERROR ANALYSIS\n");
        var linter = new LinterHandler();
        linter.config.rules = {};
        getErrorsFor(snippets,linter.lint.bind(linter), (s) => s.code);
    }).timeout(0);
    it("Should tell us rule info", async function(){
        logger.info("--------");
        logger.info("RULE ANALYSIS\n");
        var linter = new LinterHandler();
        getErrorsFor(snippets,linter.lint.bind(linter), (s) => s.code, LinterHandler.errors);
    }).timeout(0);
    it("Should tell us impact of eslint fixes", function(){
        logger.info("--------");
        logger.info("ESLINT FIX ANALYSIS\n");
        var linter = new LinterHandler();
        var fixer = new Fixer(linter);
        fixer.deleteMode = false;
        getErrorsFor(snippets, fixer.fix.bind(fixer), undefined, LinterHandler.errors)
    });
    it("Should tell us impact of deletion", function(){
        logger.info("--------");
        logger.info("DELETION ANALYSIS\n");
        var linter = new LinterHandler();
        var fixer = new Fixer(linter);
        fixer.eslint = false;
        getErrorsFor(snippets, fixer.fix.bind(fixer), undefined, LinterHandler.errors)
    }).timeout(0);
    it("Should tell us impact of eslint + deletion", function(){
        logger.info("--------");
        logger.info("ALL FIXES ANALYSIS\n");
        var linter = new LinterHandler();
        var fixer = new Fixer(linter);
        getErrorsFor(snippets, fixer.fix.bind(fixer), undefined, LinterHandler.errors)
    }).timeout(0);
    // it("Should tell us line deletion stats", async function(){
    //     logger.info("--------");
    //     logger.info("ERROR ANALYSIS\n");
    //     var compiler = new Compiler();
    //     var fixer = new Fixer(compiler);
    //     await getErrorsFor(snippets, fixer.fix.bind(fixer), logger, s => s, BASE + "/postDeleteSample.json")
    //     compiler.close()
    // }).timeout(0);
});