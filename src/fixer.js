const Compiler = require("./ts/compiler/compiler");
const Snippet = require("./snippet");
const TSFixer = require("./ts/ts-fixer");
const CustomFixer = require("./custom-fixer");
const LanguageService = require("./ts/language-service");


class Fixer{
    /**
     * @param {Compiler} compiler 
     */
    constructor(compiler){
        this.compiler = compiler;
        this.TSFixer = new TSFixer();
        this.languageService = new LanguageService();
        this.customFixer = new CustomFixer(this.languageService);

        //options
        this.tsFixes = true;
        this.customFixes = true;
        this.deletions = true;

        this.originalSnippet = undefined;
    }

    async fix(snippet){
        //step 1, get errors
        snippet = await this.evaluate(snippet);

        //apply TS fixes if enabled
        if(this.tsFixes){
            snippet = await this.doTSFixes(snippet);
        }

        //do deletions if enabled
        if(this.deletions){
            snippet = await this.deletionLoop(snippet);
        }

        if(this.customFixes){
            snippet = await this.doCustomFixes(snippet);
        }

        return snippet;
    }

    async evaluate(snippet){
        try{
            snippet.errors = await this.compiler.compile(snippet.code);
        }catch(e){
            //snippet.errors = ["Compile Failure"]
            snippet.compileFail = true;
        }
        return snippet;
    }

    async doTSFixes(snippet){
        if(snippet.compileFail || snippet.lineFail) return snippet;
        var fixed = this.TSFixer.fix(snippet.code);
        if(fixed !== snippet.code && fixed !== undefined){
            snippet.code = fixed;
            snippet.tsFixed = true;
            snippet = await this.evaluate(snippet);
        }
        return snippet;
    }

    async deletionLoop(snippet){
        //store for error case
        this.originalSnippet = Snippet.clone(snippet);
        //step 2a, if not fixable, return
        //no errors or didnt compile: it wont have error lines
        if(snippet.compileFail || snippet.errors.length <= 0 ) return snippet; 

        //step 2b, if it has errors try to fix
        var prevSnippet;
        var stop = false;

        //start at the first error
        var i = 0;
        var loops = 0;
        while(!stop){
            loops++;
            prevSnippet = Snippet.clone(snippet);

            //get error
            var error = prevSnippet.errors[i];

            //check for inconsistent line numbers
            if(error.line-1 >= snippet.code.split("\n").length){
                //return original snippet and record error
                this.originalSnippet.lineFail = true;
                this.originalSnippet.fixed = false;
                return this.originalSnippet
            }

            //if already commented out, skip
            if(this.isCommented(snippet.code, error.line)){
                i++;
                if(i >= snippet.errors.length) stop = true;
                //no more errors to try, end
                continue;
            }

            //try delete
            snippet = this.deleteForError(snippet,error)
            snippet = await this.evaluate(snippet);

            //if the change made things worse
            if(snippet.compileFail || snippet.errors > prevSnippet.errors){
                //reset snippet
                snippet = prevSnippet;
                //try next error
                i++;
                //no more errors to try, end
                if(i >= snippet.errors.length) stop = true;
                continue;
            } 

            //keeping a change, start from top of errors again
            i = 0;
            snippet.fixed = true;
            snippet = Fixer.hasCode(snippet)
            // console.log("keep")

            //if the change fixed all errors
            if(snippet.errors.length == 0) stop = true;
        }

        return snippet;
    }

    async doCustomFixes(snippet){
        //ignore fail cases
        if(snippet.compileFail || snippet.lineFail) return snippet;
        var fixed = this.customFixer.fix(snippet);
        return snippet;
    }

    deleteForError(snippet, error){
        var code = snippet.code;
        var lineNo = error.line;
        code = this.commentLine(code, lineNo);
        snippet.code = code;
        return snippet;
    }

    commentLine(code, lineNo){
        var line = this.getLine(code, lineNo);
        var lines = code.split("\n");
        var index = lineNo - 1;
        lines[index] = "// " + line;
        return lines.join("\n");
    }

    isCommented(code, lineNo){
        var line = this.getLine(code, lineNo)
        if(line.trim().startsWith("//")) return true;
        return false;
    }

    getLine(code, lineNo){
        var index = lineNo - 1;
        var lines = code.split("\n");
        return lines[index];
    }

    /**
     * Check if has code and update snippet state.
     */
    static hasCode(snippet){
        snippet.hasCode = false;
        var lines = snippet.code.split("\n")
        var count = 0;
        for(var line of lines){
            //on first non commented line, it is true
            line = line.trim();
            if(line){
                if(!line.startsWith("//")){
                    snippet.hasCode = true;
                    count++; //this is good enough for comparing our removals
                }
            }
        }
        snippet.nondeletedLines = count;
        return snippet;
    }
}

module.exports = Fixer