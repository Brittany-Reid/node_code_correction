
// const Fixer = require("./fixer");
// const LinterHandler = require("./linter-handler");
const Snippet = require("./snippet");
const Compiler = require("./compiler/compiler");
const Fixer = require("./fixer");

/**
 * Snippet Evaluator that counts and fixes errors.
 * This class uses snippet objects.
 */
class Evaluator{
    constructor(){
        this.compiler = new Compiler();
        this.fixer = new Fixer(this.compiler);
    }

    /**
     * Gets errors for a list of snippets.
     * @param {Snippet[]} snippets Array of snippets to get error for.
     * @return {Snippet[]} Array of snippets with error information updated.
     */
    async errors(snippets){
        for(var i=0; i<snippets.length; i++){
            var errors;
            try{
                errors = await this.compiler.compile(snippets[i].code);
            } catch(e){
                //on compile fail
                errors = ["Compile Failure"]; //the error array shouldn't be empty in this case
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
     * @return {Snippet[]} Array of snippets after fixing with error information updated.
     */
    fix(snippets){

        for(var i=0; i<snippets.length; i++){
            snippets[i] =this.fixer.fix(snippets[i]);
        }

        return snippets;
    }
}


module.exports = Evaluator;