const Evaluator = require("./Evaluator");
const Snippet = require("./snippet");

/**
 * Wrapper for NCC app.
 */
class NCC{

    /**
     * Returns errors for a set of snippets.
     * Run in batches as it sets up a compile server.
     * @param {String[]} snippets String snippets to get errors for
     * @return {Promise<Snippet[]>} An array of snippet objects. Get errors using `.errors`.
     */
    static async getErrors(snippets){
        this.evaluator.timeout = this.timeout;

        var snippetObjects = this._snippetise(snippets);
        return this.evaluator.errors(snippetObjects);
    }
    /**
     * Returns fixed snippets.
     * Run in batches as it sets up a compile server.
     * @param {String[]} snippets string snippets to fix
     * @return {Promise<Snippet[]>} An array of snippet objects.
     */
    static async fix(snippets){
        this.evaluator.timeout = this.timeout;

        var snippetObjects = this._snippetise(snippets);
        return this.evaluator.fix(snippetObjects);
    }

    /**
     * Private, makes array of Snippet objects from strings
     * @param {String[]} snippets string snippets to make
     * @returns {Snippet[]}
     */
    static _snippetise(snippets){
        var snippetObjects = [];
        for(var s of snippets){
            snippetObjects.push(
                new Snippet(s) //we don't need the other fields for this
            )
        }
        return snippetObjects;
    }
}

NCC.evaluator = new Evaluator();
NCC.timeout = 60000;

module.exports = NCC