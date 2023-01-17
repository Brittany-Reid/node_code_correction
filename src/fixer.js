const Compiler = require("./ts/compiler/compiler");
const Snippet = require("./snippet");
const TSFixer = require("./ts/ts-fixer")


class Fixer{
    /**
     * 
     * @param {Compiler} compiler 
     */
    constructor(compiler){
        this.compiler = compiler;
        this.TSFixer = new TSFixer();

        //options
        this.tsFixes = true;
        this.deletions = true;
    }

    async fix(snippet){
        //step 1, get errors
        snippet = await this.evaluate(snippet);

        //store for error case
        var originalSnippet = Snippet.clone(snippet);

        // console.log(snippet)

        //step 2a, if not fixable, return
        //no errors or didnt compile: it wont have error lines
        if(snippet.compileFail || snippet.errors.length <= 0 ) return snippet; 

        // console.log(snippet.code + "\n---\n");

        //if ts-fixes
        if(this.tsFixes){
            snippet = await this.doTSFixes(snippet);
        }

        // console.log(snippet.code + "\n---\n");

        //stop here if we don't do deletions
        if(!this.deletions) return snippet;

        // console.log("DELETIONS")


        //step 2a, if not fixable, return
        //no errors or didnt compile: it wont have error lines
        if(snippet.compileFail || snippet.errors.length <= 0 ) return snippet; 


        //step 2b, if it has errors try to fix
        var prevSnippet;
        var stop = false;

        //start at the first error
        var i = 0;
        var loops = 0;

    //    console.log("START")

        while(!stop){
      //      console.log("LOOP:" + loops)
            loops++;

            prevSnippet = Snippet.clone(snippet);
            //get error
            var error = prevSnippet.errors[i];

            //if already commented out, skip
            if(error.line-1 >= snippet.code.split("\n").length){
                //return original snippet
                originalSnippet.lineFail = true;
                originalSnippet.fixed = false;
                return originalSnippet
            }
            if(this.isCommented(snippet.code, error.line)){
                i++;
                if(i >= snippet.errors.length) stop = true;
                //no more errors to try, end
                continue;
            }

            //try delete
            snippet = this.deleteForError(snippet,error)
            //console.log("deleting line "+ error.line)
            snippet = await this.evaluate(snippet);

            //if the change made things worse
            if(snippet.compileFail || snippet.errors > prevSnippet.errors){
                //console.log("discard")
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

  //      console.log("---\nFINAL:")

//        console.log(snippet + "\n")

        //console.log(snippet.code + "\n---\n");

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

    /**
     * Attempt to fix the code.
     */
    async tryFix(snippet){
        return await this.lineDeletion(snippet);
    }

    /**
     * Tries to delete the next line.
     */
    async lineDeletion(snippet){
        var errors = snippet.errors;
        for(var e of errors){
            snippet = this.tryDelete(snippet, e);
            console.log(snippet.code)
            break;
        }
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
        //keep in case i readd eslint
        // if(parse) this.parse(snippet)
        // var code = this.linter.linter.getSourceCode();
        // if(!code) return snippet;
        // var ast = code.ast;
        // if(!ast.tokens || ast.tokens.length === 0){
        //     snippet.hasCode = false;
        // }
        // return snippet;
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

    async doTSFixes(snippet){
        if(snippet.compileFail || snippet.lineFail) return snippet;
        var fixed = this.TSFixer.fix(snippet.code);
        if(fixed !== snippet.code && fixed !== undefined){
            // console.log(snippet.code)
            // console.log("---")
            // console.log(fixed)
            snippet.code = fixed;
            snippet.tsFixed = true;
            snippet = await this.evaluate(snippet);
        }
        return snippet;
    }
}

module.exports = Fixer