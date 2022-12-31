/** 
 * @fileoverview Run experiments
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
const Fixer = require("../../src/fixer");

// directories
const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "delete");
const DATA_PATH = path.join(BASE, "data/dataset.csv");

// create logger
const logger = winston.createLogger();
var filename = path.join(
    INFO_LOG_DIR,
    "delete" + Date.now() + ".log",
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
        await loadData();
    });

    it("Should tell us how many packages", function (){
        logger.info("TOTAL PACKAGES: " + packages.length);
    })
    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })

    it("Should tell us line deletion stats", async function(){
        logger.info("--------");
        logger.info("ERROR ANALYSIS\n");
        var compiler = new Compiler();
        var fixer = new Fixer(compiler);
        var errorCounter = new ErrorCounter();
        var noErrors = 0;
        var compilerErrored = [];
        var noLines = 0;
        var i = 0;
        var max = 0;
        var fixed = 0;
        var maxid;
        snippets = _.sampleSize(snippets, 384)//do a sample
        var length = snippets.length;
        console.log(snippets.length)
        for(var s of snippets){
            // if(i < 1500000 || i > 1491711 + snippets.length/100){
            // if(i < 1696697){
            //     i++
            //     continue;
            // }
            console.log(i)
            var fixed = await fixer.fix(s);
            var errors = fixed.errors;
            if(fixed.compileFail) compilerErrored.push(fixed.id);
            if(errors.length < 1) noErrors++;
            if(!fixed.hasCode) noLines++;
            if(fixed.fixed) fixed++; //means was corrected in some way
            for(var e of errors){
                errorCounter.add(e, s.id);
            }
            i++
        }
        logger.info("ERROR, CODE, CATEGORY, NUM OCCURANCES, NUM AFFECTED SNIPPETS, FIRST ID, PERCENT")
        var keys = errorCounter.getKeys()
        length = length - (compilerErrored);
        for(var k of errorCounter.getKeys()){
            var e = errorCounter.get(k);
            var rule = e.rule;
            if(typeof rule !== 'string'){
                rule = rule.messageText;
            }
            logger.info(rule + ", " + e.code + ", " + e.category +  ", " + e.occurances + ", " + e.affectedSnippets.size + ", "  + e.first +  ", " + (e.affectedSnippets.size/length));
            // output examples for each error
            // var exampleID = e.affectedSnippets.values().next().value;
            // var example = idToSnippet.get(exampleID)['code'];
            // logger.info("\n" + example)
        }
        logger.info("");
        //logger.info("Snippets without lines: " + noLines + "/" + length + "(" + (noLines/length) +")")
        logger.info("Snippets no lines: " + noLines + "/" + length + "(" + (noLines/length) +")")
        logger.info("Snippets without errors: " + noErrors + "/" + length + "(" + (noErrors/length) +")")
        logger.info("Snippets failed: " + compilerErrored.length + "/" + snippets.length + "(" + (compilerErrored.length/snippets.length) +")")
        compiler.close()
    }).timeout(0);
});