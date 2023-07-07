const ts = require("typescript");
const CustomFixes = require("./custom-fixes");
const Snippet = require("./snippet");
const LanguageService = require("./ts/language-service");

/**
 * Handles the custom fixes for Fixer.
 */
class CustomFixer{
    /**
     * @param {LanguageService} languageService
     */
    constructor(languageService){
        this.languageService = languageService;
        this.probablyNeedSemi = undefined;
        //error codes with a fix
        this.errorCodes = {
            "cannot find name": new Set([2304, 2552])
        }
    }

    /**
     * Takes a snippet as input.
     * @param {Snippet} snippet
     */
    fix(snippet){
        if(snippet.errors !== undefined && snippet.errors.length < 1) return snippet;
        else if(snippet.errors === undefined || snippet.errors[0].file === undefined) snippet = this.evaluate(snippet);
        this.probablyNeedSemi = ts.probablyUsesSemicolons(this.languageService.sourceFile);
        //get error line map
        snippet = this.makeErrorLineMap(snippet);
        snippet = this.fixLoop(snippet);
        return snippet;
    }

    evaluate(snippet){
        var errors = this.languageService.getErrors(snippet.code);
        snippet.errors = errors;
        snippet = this.makeErrorLineMap(snippet);
        return snippet;
    }

    /**
     * Associate line numbers with errors.
     */
    makeErrorLineMap(snippet){
        snippet.lineMap = {};
        if(!snippet.errors) return snippet;
        var lineMap = snippet.lineMap;
        for(var e of snippet.errors){
            var line = e.line;
            var code = e.code;
            if(lineMap[line]) lineMap[line].push(code);
            else{
                lineMap[line] = [code]
            }
        }
        snippet.lineMap = lineMap;
        return snippet;
    }

    fixLoop(snippet){
        var originalSnippet = Snippet.clone(snippet);
        var prevSnippet = undefined;
        var lastErrorMessage = undefined;

        var names = []; //store what variable names have already been added

        //error index
        var i = 0;

        var stop = false;
        while(!stop){
            // console.log("\n")
            //if this variable has already been defined
            if(snippet.errors[i] && names.includes(snippet.errors[i].message)) break;
            //save the previous version of the snippet
            prevSnippet = Snippet.clone(snippet);

            //exit if no errors or compile failed
            if(snippet.compileFail || snippet.errors.length <= 0 ) return snippet; 

            //try to fix next error
            lastErrorMessage = snippet.errors[i].message;
            snippet = this.tryFixError(snippet, i);

            //if a change was made?
            if(snippet.code !== prevSnippet.code){
                //keep if improved
                if(this.improve(snippet, prevSnippet)){
                    if(this.errorCodes["cannot find name"].has(prevSnippet.errors[i].code)) names.push(lastErrorMessage) //store variable names we've added
                    //reset error index
                    i = 0;
                    snippet.fixed = true;
                    //if the change fixed all errors
                    if(snippet.errors.length == 0) stop = true;
                    //if the same error persists, only for the cannotfindname case for now //i dont have a test case for this because i fixed the placement bug
                    else if(lastErrorMessage == snippet.errors[i].message && this.errorCodes["cannot find name"].has(snippet.errors[i])) stop = true;
                    continue;
                }
                //else revert
                else{
                    snippet = prevSnippet;
                }
            }

            //move to next error
            i++;
            if(i >= snippet.errors.length) stop = true;

        }

        return snippet;
    }

    tryFixError(snippet, error_index){
        var code = snippet.code;
        var error = snippet.errors[error_index];
        var errorCode = error.code;
        // console.log(error.code)
        // console.log(error.message)

        //try fixes
        if(this.errorCodes["cannot find name"].has(errorCode)) code = CustomFixes.fixCannotFindName(code, error, this, snippet.lineMap);

        if(!code) return snippet;
        snippet.code = code;

        return snippet;
    }

    improve(snippet, prevSnippet){
        snippet = this.evaluate(snippet);
        //does not make worse
        if(snippet.errors.length <= prevSnippet.errors.length) return true;
        return false;
    }

}

module.exports = CustomFixer;