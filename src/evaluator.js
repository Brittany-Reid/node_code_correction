
// const Fixer = require("./fixer");
// const LinterHandler = require("./linter-handler");
const Snippet = require("./snippet");
const Compiler = require("./ts/compiler/compiler");
const Fixer = require("./fixer");

/**
 * Snippet Evaluator that counts and fixes errors.
 * This class uses snippet objects.
 */
class Evaluator{
    constructor(){
        this.compiler = undefined;
        this.fixer = undefined;
        this.timeout = 60000;
    }

    /**
     * Gets errors for a list of snippets.
     * @param {Snippet[]} snippets Array of snippets to get error for.
     * @return {Promise<Snippet[]>} Array of snippets with error information updated.
     */
    async errors(snippets){
        if(!this.compiler){
             this.compiler = new Compiler();
             this.compiler.timeout = this.timeout;
        }
        if(!this.fixer) this.fixer = new Fixer(this.compiler);

        for(var i=0; i<snippets.length; i++){
            var errors;
            try{
                errors = await this.compiler.compile(snippets[i].code);
            } catch(e){
                // on compile fail
                // from runs, this is almost always for non-code
                errors = undefined; //errors should be undefined in error case
                snippets[i].compileFail = true; //but obviously 'couldn't even compile' is worse than all other errors so mark this for sorting
            }
            snippets[i].errors = errors;
        }

        this.compiler.close()
        return snippets;
    }

    /**
     * Fix errors for a given array of snippet objects.
     * @param {Snippet[]} snippets Set of snippets to fix.
     * @return {Promise<Snippet[]>} Array of snippets after fixing with error information updated.
     */
    async fix(snippets){
        if(!this.compiler){
            this.compiler = new Compiler();
            this.compiler.timeout = this.timeout;
        }
        if(!this.fixer) this.fixer = new Fixer(this.compiler);
        
        for(var i=0; i<snippets.length; i++){
            snippets[i] = await this.fixer.fix(snippets[i]);
        }

        this.compiler.close()
        return snippets;
    }
}


module.exports = Evaluator;