/**
 * Snippet object.
 */

class Snippet {
    constructor(code, id, order, packageObject) {
    //snippet string
        this.code = code;
        //id code
        this.id = id;
        //order in readme
        this.order = order;

        this.package = packageObject ? packageObject.name : undefined;
        this.stars = packageObject ? packageObject.stars : 0;

        this.rankValue = undefined;
        this.errors = undefined;
        this.hasCode = true;
        this.nondeletedLines = undefined;
        this.fixed = false;
        this.tsFixed = false;

        // in the rare case of a fail compile via typescript error or timeout
        // in this case the code was always something odd and we just consider these 'unfixable'.
        this.compileFail = false;

        //typescript messed up the line numbers! this seemed to happen with package 42matters which had highlighting in a string with newlines.
        this.lineFail = false;
    }

    /**
     * 
     * @param {Snippet} snippet 
     */
    static clone(snippet){
        var newSnippet = new Snippet(snippet.code, snippet.id, snippet.order, snippet.packageObject);
        newSnippet.rankValue = snippet.rankValue;
        newSnippet.errors = snippet.errors;
        newSnippet.hasCode = snippet.hasCode;
        newSnippet.fixed = snippet.fixed;
        newSnippet.compileFail = snippet.compileFail;
        newSnippet.lineMap = snippet.lineMap;
        return newSnippet;
    }

    /**
   * Calculate a rank value for snippet based on number of errors.
   */
    rank() {
        if(typeof this.rankValue === "undefined"){
            this.rankValue = undefined;
            if(typeof this.errors === "undefined") return undefined; //not evaluated
            if(this.hasCode === false) return undefined; //undefined is always at end of set, so return undefined here
            if(this.compileFail === true) return undefined; //undefined is always at end of set, so return undefined here
            this.rankValue = this.errors.length;
        }
        return this.rankValue;
    }

    /**
     * Snippet sort function, use as comparator argument to Array.sort() etc.
     * Sorts in ascending order.
     */
    static sort(a, b){
        //calculate rank
        var rankA = a.rank();
        var rankB = b.rank();

        //handle undefined
        if(typeof rankA === "undefined" && typeof rankB === "undefined"){
            return 0;
        }
        if(typeof rankA === "undefined" && typeof rankB === "number"){
            return 1;
        }
        if(typeof rankA === "number" && typeof rankB === "undefined"){
            return -1;
        }

        //if a is less than b
        if(rankA < rankB){
            return -1;
        }

        //if a is more than b
        if(rankA > rankB){
            return 1;
        }

        return 0;
    }
}

module.exports = Snippet;