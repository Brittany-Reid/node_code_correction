const Compiler = require("./ts/compiler/compiler");
const Fixer = require("./fixer");
const Snippet = require("./snippet");
const fs = require("fs");

/**
 * Class for testing.
 */
class ErrorCounter{
    constructor(){
        this.map = new Map();
    }

    add(error, id){
        var message = error.message;
        var errorCode = error.code;
        var rule = this.getRule(errorCode, message);
        var data = this.map.get(errorCode);
        if(!data) data = {
            occurances: 0,
            affectedSnippets: new Set(),
            code: errorCode,
            rule: rule,
            first: id,
            category: error.category,
        }
        data.affectedSnippets.add(id);
        data.occurances++;
        this.map.set(errorCode, data);
    }

    getRule(code, message){
        var rule = message;
        // generics from https://github.com/Microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
        switch(code){
            case 2304:
                rule = "Cannot find name"
                break;
            case 1005:
                rule = "Character expected"
                break;
            case 2365:
                rule = "Operator cannot be applied to types 1 and 2"
                break;
            case 1435:
                rule = "Unknown keyword or identifier"
                break;
            case 2307:
                rule = "Cannot find module"
                break;
            default:
                break;
        }
        return rule;
    }

    get(key){
        return this.map.get(key)
    }

    getKeys(){
        var keys = Array.from(this.map.keys());
        keys.sort((a, b)=>{
            var aValue = this.map.get(a).occurances;
            var bValue = this.map.get(b).occurances;
            return bValue - aValue;
        })
        return keys;
    }

    static async getErrorsFor(snippets, fn, logger, sn, file){
        if(file){
            fs.writeFileSync(file, "[", {encoding:"utf-8"})
        }
        var errorCounter = new ErrorCounter();
        var totalErrors = 0;
        var noErrors = 0;
        var timedOuts = [];
        var debugErrored = [];
        var lineFailed = [];
        var noLines = 0;
        var fixed = 0;
        var i = 0;
        var length = snippets.length;
        //lines of code, for pre-deletion this is just the baseline 'not commented out with //' lines.
        var nondeletedLines = 0;
        console.log("For: " + snippets.length)
        var postSnippets = [];
        for(var s of snippets){
            // console.log(s.code)
            //clone to not carry changes between techniques
            s = Snippet.clone(s);
            // if(i < 1149){
            // if(i < 458865){
            //     i++
            //     continue;
            // }
            if(i !== 0 && file){
                fs.appendFileSync(file, ",\n", {encoding:"utf-8"})
            }
            console.log(i)
            var code = s.code;
            var errors = [];
            var output = undefined;
            try{
                output = await fn(sn(s));
            }
            catch(e){
                console.log(e);
                if(e === "Timeout") timedOuts.push(i);
                else{
                    
                    debugErrored.push(i);
                    console.log(code)
                }
                s.compileError = true;
            }
            
            //get output
            if(output instanceof Snippet){
                s = output
                errors = s.errors;
            }else{
                errors = output;
                s.errors = errors;
            }

            //record line fails
            if(s.lineFail){
                console.log("line fail")
                console.log(s.code)
                lineFailed.push(s.id)
            }

            //record no lines
            s = Fixer.hasCode(s)
            if(!s.hasCode){
                noLines++
            }
            //record lines
            if(s.nondeletedLines !== undefined)
                nondeletedLines += s.nondeletedLines;
            //record if fixed
            if(s.fixed || s.tsFixed){
                fixed++
            }
            //handle errors if have
            if(!s.compileError && errors){
                if(errors.length < 1) noErrors++;
                for(var e of errors){
                    totalErrors++;
                    errorCounter.add(e, s.id);
                }
            }
            else{
                console.log(s)
            }

            if(s.errors){
                for(var n in s.errors){
                    s.errors[n] = s.errors[n].code;
                }
            }

            //write to code snippet file
            if(file){
                fs.appendFileSync(file, JSON.stringify(s, undefined, 2), {encoding:"utf-8"})
                //fs.writeFileSync(output, "[", {encoding:"utf-8"})
            }

            postSnippets.push(s)
            i++;
        }
        logger.info("ERROR, CODE, CATEGORY, NUM OCCURANCES, NUM AFFECTED SNIPPETS, FIRST ID, PERCENT")
        var keys = errorCounter.getKeys()
        for(var k of errorCounter.getKeys()){
            var e = errorCounter.get(k);
            var rule = e.rule;
            if(typeof rule !== 'string'){
                rule = rule.messageText;
            }
            logger.info(rule + ", " + e.code + ", " + e.category +  ", " + e.occurances + ", " + e.affectedSnippets.size + ", "  + e.first +  ", " + (e.affectedSnippets.size/length));
        }
        logger.info("");
        length = length - (timedOuts.length + debugErrored.length);
        //logger.info("Snippets without lines: " + noLines + "/" + length + "(" + (noLines/length) +")")
        logger.info("Total errors: " + totalErrors)
        logger.info("Snippets without errors: " + noErrors + "/" + length + "(" + (noErrors/length) +")")
        logger.info("Fixed: " + fixed + "/" + length + "(" + (fixed/length) +")")
        logger.info("Snippets no lines: " + noLines + "/" + length + "(" + (noLines/length) +")")
        logger.info("Code lines: " + nondeletedLines)
        logger.info("Snippets timed out: " + timedOuts.length + "/" + snippets.length + "(" + (timedOuts.length/snippets.length) +")")
        logger.info("Snippets failed: " + debugErrored.length + "/" + snippets.length + "(" + (debugErrored.length/snippets.length) +")")
        logger.info("Snippets lineFailed: " + lineFailed.length + "/" + snippets.length + "(" + (lineFailed.length/snippets.length) +")")
        console.log(timedOuts)
        console.log(debugErrored)
        if(file) fs.appendFileSync(file, "]", {encoding:"utf-8"})

        return postSnippets;
    }
}

module.exports = ErrorCounter