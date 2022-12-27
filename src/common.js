/** 
 * @fileoverview Common functionality.
 */

const path = require("path");
const ROOT = "node_code_correction";

/**
 * 
 * @returns 
 */
function getBaseDirectory() {
    var base = __dirname;
    //fall back if we run from node_code_query/ncq
    if (
        path.dirname(base) != ROOT &&
    path.dirname(base) != ROOT + "/"
    ) {
        base = path.join(base, "../");
    }
    base = path.resolve(base);
    return base;
}

module.exports = {
    getBaseDirectory
};