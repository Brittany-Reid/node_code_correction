const ts = require("typescript");

var PLACEHOLDER_STRING = "\"Your Value Here\"";

/**
 * Custom fixes as static functions.
 */
class CustomFixes{
    /**
     * @param {String} code 
     * @param {*} error The error object needs to include the sourceFile.
     */
    static fixCannotFindName(code, error, customFixer){
        var file = error.file;
        var probablyNeedSemi = customFixer.probablyNeedSemi;
        
        //get node
        var errorPos = error.start;
        var node = ts.getTokenAtPosition(file, errorPos);
        var name = ts.getTextOfNode(node);

        //create placeholder string declaration
        var stringDeclaration = this.makeStringDeclaration(name, probablyNeedSemi)
        
        code = this.insertAbove(code, stringDeclaration, node);

        return code;
    }

    static makeStringDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + " = " + this.PLACEHOLDER_STRING + (probablyNeedSemi ? ";" : "");
        return declaration;
    }

    static getStatement(node){
        return ts.findAncestor(node, ts.isStatement);
    }

    static insertAbove(code, toInsert, node){
        //get node start position
        var statement = this.getStatement(node);
        var statementStart = statement.getFullStart();

        var before = code.substring(0, statementStart);
        var after = code.substring(statementStart);
        if(after.startsWith("\n")){
            before += "\n";
            after = after.substring(1)
        }

        var indent = this.getIndent(statement)

        code = before + indent + toInsert + "\n" + after;
        return code;
    }

    static getIndent(statement){
        var text = statement.getFullText().replace("\n", "");
        var indent = text.match(/^\s+/);
        if(!indent) return "";
        return indent;
    }
}

//make these accessible for testing
CustomFixes.PLACEHOLDER_STRING = PLACEHOLDER_STRING;

module.exports = CustomFixes;