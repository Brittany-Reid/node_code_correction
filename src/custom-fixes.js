const ts = require("typescript");
const CustomFixer = require("./custom-fixer")

const BUILT_INS = new Set(require('repl')._builtinLibs);
//if expects expression, or unexpected keyword or identifier, the issue isn't JUST this
const POSSIBLE_NO_EXPRESSION = new Set([1109, 1434])

const PLACEHOLDER_STRING = "\"Your Value Here\"";
const PLACEHOLDER_STRING_ARRAY = "[\"YOUR\", \"VALUE\", \"HERE\"]";
const PLACEHOLDER_NUMBER = "0";
const PLACEHOLDER_NUMBER_ARRAY = "[1, 2, 3]";
const PLACEHOLDER_TYPE_SUGGESTION = " // Suggested Type: ";
const STRING_PROPERTIES = new Set(Object.getOwnPropertyNames(String.prototype));

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
    static fixCannotFindName(code, error, customFixer, lineMap){

        //check if fixable?
        var errorsOnLine = this.getErrorsOnLine(error, lineMap);
        if(errorsOnLine && errorsOnLine.some( a => POSSIBLE_NO_EXPRESSION.has(a) )) return;

        /**@type {ts.SourceFile} */
        var file = error.file;
        var program = customFixer.languageService.ls.getProgram();
        var typeChecker = program.getTypeChecker();
        // var program = error.program;
        // var typeChecker = program.getTypeChecker();
        var probablyNeedSemi = customFixer.probablyNeedSemi;
        //get node
        var errorPos = error.start;
        var node = ts.getTokenAtPosition(file, errorPos);
        var name = ts.getTextOfNode(node);

        var parent = node.parent;

        //attempt to get type
        var type = this.getType(node, parent, typeChecker);

        //is a method call? let TS handle
        if(ts.isCallExpression(parent) && parent.expression == node){
            return false; 
        }
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
                if(!STRING_PROPERTIES.has(accessName)) return false;
            }
        }

        code = this.insertVariableDeclaration(name, node, code, file, probablyNeedSemi, type, typeChecker);
        return code;
    }

    static fixUnknownAPI(code, error, customFixer){
        var file = error.file;
        var probablyNeedSemi = customFixer.probablyNeedSemi;

        var errorPos = error.start;
        var node = ts.getTokenAtPosition(file, errorPos);
        var name = ts.getTextOfNode(node);

        //exit if no builtin
        if(!BUILT_INS.has(name)) return false;

        var importDeclaration = this.makeImportDeclaration(name, probablyNeedSemi);
        code = this.insertAtTop(code, importDeclaration, file);
        return code;
    }
    
    //helpers:

    static insertVariableDeclaration(name, node, code, file, probablyNeedSemi, type, typeChecker){
        var typeString = typeChecker.typeToString(type);
        var declaration = "";
        var typeComment = "";
        if(typeString === "number"){
            declaration = this.makeNumberDeclaration(name, probablyNeedSemi);
        }
        else if(typeString === "number[]"){
            declaration = this.makeNumberArrayDeclaration(name, probablyNeedSemi);
        }
        else if(typeString === "string[]"){
            declaration = this.makeStringArrayDeclaration(name, probablyNeedSemi);
        }
        else{
            //other type
            if(type && typeChecker.isArrayType(type)){
                declaration = this.makeStringArrayDeclaration(name, probablyNeedSemi);
            }
            else{
                declaration = this.makeStringDeclaration(name, probablyNeedSemi);
            }

            //if we have a type, inform developers
            if(type && typeString != "any"){
                typeComment = PLACEHOLDER_TYPE_SUGGESTION + typeString;
                declaration += typeComment;
            }
        }
        code = this.insertAbove(code, declaration, node, file);
        return code;
    }

    /**
     * Try to get type.
     * From: https://github.com/microsoft/TypeScript/blob/main/src/services/codefixes/addOptionalPropertyUndefined.ts
     * @param node 
     * @param parent
     * @param {ts.TypeChecker} typeChecker
     * @returns Undefined when no type.
     */
    static getType(node, parent, typeChecker){
        var type = undefined;
        //for call expressions
        if(ts.isCallExpression(parent)){
            var index = parent.arguments.indexOf(node);
            if(index == -1) return undefined;
            var hasDotDotDot = this.hasDotDotDot(index, parent, typeChecker);
            var containingType = typeChecker.getSymbolAtLocation(parent.expression);
            if(!containingType) return undefined;
            if(!containingType.valueDeclaration) return undefined;
            if(!containingType.valueDeclaration.parameters) return undefined;
            //console.log(typeChecker.typeToString(typeChecker.getTypeAtLocation(parent.expression)))
            // console.log(typeChecker.getTypeAtLocation(parent.expression))
            // console.log(containingType)
            // console.log(containingType.declarations[0])
            var param = (containingType.valueDeclaration).parameters[index];
            if(!param) return undefined;
            var typeName = param.name;
            type = typeChecker.getTypeAtLocation(typeName);
            if(hasDotDotDot && typeChecker.isArrayType(type)){
                type = typeChecker.getTypeArguments(type)[0];
            }
        }
        return type;
    }

    static hasDotDotDot(index, parent, typeChecker){
        var signature = typeChecker.getResolvedSignature(parent)
        if(!signature) return false;
        var parameters = signature.getParameters();
        if(!parameters) return false;
        var param = parameters[index];
        if(!param) return false;
        // var type  = typeChecker.getTypeOfSymbolAtLocation(parameters[index], parent);
        // console.log(typeChecker.typeToString(type))
        return param.getDeclarations()?.[0].dotDotDotToken
    }

    static makeDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + (probablyNeedSemi ? ";" : "");
        return declaration;
    }

    static makeNumberDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + " = " + this.PLACEHOLDER_NUMBER + (probablyNeedSemi ? ";" : "");
        return declaration
    }

    static makeNumberArrayDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + " = " + this.PLACEHOLDER_NUMBER_ARRAY + (probablyNeedSemi ? ";" : "");
        return declaration
    }

    static makeStringArrayDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + " = " + this.PLACEHOLDER_STRING_ARRAY + (probablyNeedSemi ? ";" : "");
        return declaration
    }

    static makeStringDeclaration(name, probablyNeedSemi){
        var declaration = "var " + name + " = " + this.PLACEHOLDER_STRING + (probablyNeedSemi ? ";" : "");
        return declaration;
    }

    static makeImportDeclaration(name, probablyNeedSemi){
        var declaration = "const " + name + " = require(\""+ name + "\")" + (probablyNeedSemi ? ";" : "");
        return declaration;
    }
    
    static getErrorsOnLine(error, lineMap){
        var line = error.line;
        var errorList = lineMap[line];
        return errorList;
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
CustomFixes.PLACEHOLDER_STRING_ARRAY = PLACEHOLDER_STRING_ARRAY;
CustomFixes.PLACEHOLDER_NUMBER = PLACEHOLDER_NUMBER;
CustomFixes.PLACEHOLDER_NUMBER_ARRAY = PLACEHOLDER_NUMBER_ARRAY;
CustomFixer.PLACEHOLDER_TYPE_SUGGESTION = PLACEHOLDER_TYPE_SUGGESTION;

module.exports = CustomFixes;