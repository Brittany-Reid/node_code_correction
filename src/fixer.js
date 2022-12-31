const Compiler = require("./compiler/compiler");
const Snippet = require("./snippet");


class Fixer{
    /**
     * 
     * @param {Compiler} compiler 
     */
    constructor(compiler){
        this.compiler = compiler;
    }

    async fix(snippet){
        //step 1, get errors
        snippet = await this.evaluate(snippet);

        //step 2a, if not fixable, return
        //no errors or didnt compile: it wont have error lines
        if(snippet.errors > 0 || snippet.compileFail) return snippet; 


        //step 2b, if it has errors try to fix
        var prevSnippet = Snippet.clone(snippet)
        var stop = false;

        //start at the first error
        var i = 0;
        while(!stop){
            //get error
            var error = prevSnippet.errors[i];
            //try delete
            snippet = this.deleteForError(snippet,error)
            snippet = await this.evaluate(snippet);

            console.log(snippet)

            //if the change made things worse
            if(snippet.compileFail || snippet.errors > prevSnippet.errors){
                //reset snippet
                snippet = prevSnippet;
                //try next error
                i++;
            } 
            
            console.log(snippet.errors)
            stop = true;
        } 
        console.log(snippet)

        // var stop = false;
        // var fixed = false;

        // //multiple passes until no more fixes can be applied
        // while(!stop){
        //     var fix = this.tryFix(snippet);
        //     stop = true;
        //     // snippet = fix.snippet;
        //     // fixed = fix.fixed;
        //     // if(fixed === false){
        //     //     stop = true;
        //     // }
        //     // if(first) first = false;
        // }

        return snippet;
    }

    async evaluate(snippet){
        try{
            snippet.errors = await this.compiler.compile(snippet.code);
        }catch(e){
            snippet.errors = ["Compile Failure"]
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

    getLine(code, lineNo){
        var index = lineNo - 1;
        var lines = code.split("\n");
        return lines[index];
    }
}

async function main(){
    var compiler = new Compiler();
    var fixer = new Fixer(compiler);

    var s = await fixer.fix(new Snippet("<html>"))
    // console.log(s)

    compiler.close();
}

main()

module.exports = Fixer