/** 
 * @fileoverview Run experiments
 */


require("mocha");
const path = require("path");
const winston = require("winston");
const { getBaseDirectory, readCSVStream } = require("../../src/common");
const Compiler = require("../../src/compiler");
const ErrorCounter = require("../../src/error-counter");
const Snippet = require("../../src/snippet");

// directories
const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "info");
const DATA_PATH = path.join(BASE, "data/dataset.csv");

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
            idToSnippet.set(id, snippetObject);
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
        await loadData(10);
    });

    it("Should tell us how many packages", function (){
        logger.info("TOTAL PACKAGES: " + packages.length);
    })
    it("Should tell us how many snippets", function (){
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })

    it("Should tell us parsing error statistics", function(){
        logger.info("--------");
        logger.info("ERROR ANALYSIS\n");
        var compiler = new Compiler();
        var errorCounter = new ErrorCounter();
        var noErrors = 0;
        for(var s of snippets){
            var code = s.code;
            var errors = compiler.compile(code);
            if(errors.length < 1) noErrors++;
            for(var e of errors){
                errorCounter.add(e, s.id);
            }
        }
        logger.info("ERROR, CODE, NUM OCCURANCES, NUM AFFECTED SNIPPETS, PERCENT")
        var keys = errorCounter.getKeys()
        for(var k of errorCounter.getKeys()){
            var e = errorCounter.get(k);
            logger.info(e.rule + ", " + e.code + ", " + e.occurances + ", " + e.affectedSnippets.size + ", " + (e.affectedSnippets.size/snippets.length));
        }
        logger.info("");
        //logger.info("Snippets without lines: " + noLines + "/" + snippets.length + "(" + (noLines/snippets.length) +")")
        logger.info("Snippets without errors: " + noErrors + "/" + snippets.length + "(" + (noErrors/snippets.length) +")")
    }).timeout(0);
});