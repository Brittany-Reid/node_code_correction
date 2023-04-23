const ts = require("typescript");
const CustomFixer = require("./custom-fixer")

const BUILT_INS = require('repl')._builtinLibs
const PLACEHOLDER_STRING = "\"Your Value Here\"";
const STRING_PROPERTIES = Object.getOwnPropertyNames(String.prototype);

/**
 * Custom fixes as static functions.
 * As reference:
 * https://github.com/microsoft/TypeScript/blob/main/src/services/codefixes/fixSpelling.ts
 */
class CustomFixes{
    /**
     * @param {String} code 
     * @param {*} error The error object needs to include the sourceFile.
     * @param {CustomFixer} customFixer The error object needs to include the sourceFile.
     */
    static fixCannotFindName(code, error, customFixer){
        /**@type {ts.SourceFile} */
        var file = error.file;
        var probablyNeedSemi = customFixer.probablyNeedSemi;
        var checker = customFixer.languageService.program.getTypeChecker();
        //get node
        var errorPos = error.start;
        var node = ts.getTokenAtPosition(file, errorPos);
        var name = ts.getTextOfNode(node);

        var parent = node.parent;
        //is an undeclared assignment
        if(ts.isAssignmentExpression(parent) && parent.left == node){
            var declaration = this.makeDeclaration(name, probablyNeedSemi);
            code = this.insertAbove(code, declaration, node, file);
            return code;
        }
        //access on parent and the error isnt at the access name, look for a built in
        if(ts.isPropertyAccessExpression(parent) && parent.name !== node){
            var attempt = this.fixUnknownAPI(code, error, customFixer);
            if(attempt) return attempt;

            //if possible spelling mistake
            if(error.code == 2552){
                //leave if it wouldn't make sense as a string, as we have an alternative
                var accessName = parent.name.getText();
                if(!STRING_PROPERTIES.includes(accessName)) return false;
            }
        }
        //create placeholder string declaration
        var stringDeclaration = this.makeStringDeclaration(name, probablyNeedSemi)

        code = this.insertAbove(code, stringDeclaration, node, file);

        return code;
    }

    static fixUnknownAPI(code, error, customFixer){
        var file = error.file;
        var probablyNeedSemi = customFixer.probablyNeedSemi;
        var checker = customFixer.languageService.program.getTypeChecker();

        var errorPos = error.start;
        var node = ts.getTokenAtPosition(file, errorPos);
        var name = ts.getTextOfNode(node);

        //exit if no builtin
        if(!BUILT_INS.includes(name)) return false;

        var importDeclaration = this.makeImportDeclaration(name, probablyNeedSemi);
        code = this.insertAtTop(code, importDeclaration, file);

        return code;
    }
    
    //helpers:

    static makeDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + (probablyNeedSemi ? ";" : "");
        return declaration;
    }

    static makeStringDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + " = " + this.PLACEHOLDER_STRING + (probablyNeedSemi ? ";" : "");
        return declaration;
    }

    static makeImportDeclaration(name, probablyNeedSemi){
        var declaration = "const " + name + " = require(\""+ name + "\")" + (probablyNeedSemi ? ";" : "");
        return declaration;
    }

    static getStatement(node){
        return ts.findAncestor(node, ts.isStatement);
    }

    static insertAbove(code, toInsert, node, file){
        //get node start position
        var statement = this.getStatement(node);
        if(!statement) return false;
        var statementStart = statement.getFullStart();

        var before = code.substring(0, statementStart);
        var after = code.substring(statementStart);
        if(after.startsWith("\n")){
            before += "\n";
            after = after.substring(1)
            statementStart += 1; //handle weird \n case?
        }

        statementStart = this.getNearestLineStart(statementStart, file.getLineStarts())
        var before = code.substring(0, statementStart);
        var after = code.substring(statementStart);

        var indent = this.getIndent(statement)

        code = before + indent + toInsert + "\n" + after;
        return code;
    }

    static insertAtTop(code, toInsert, file){
        return toInsert + "\n" + code;
    }

    static getNearestLineStart(pos, lineStarts){
        var start = 0;
        for(var l of lineStarts){
            if(pos >= l) start = l;
        }
        return start;
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