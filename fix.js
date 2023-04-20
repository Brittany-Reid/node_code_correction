const ts = require("typescript");
const TypeScriptCompiler = require("./src/ts/compiler/typescript-compiler");

//use ts to parse code
//https://github.com/microsoft/TypeScript/blob/main/src/services/codefixes/returnValueCorrect.ts

var code = "var b = 0;\n\nconsole.log(\na\n);";

var compiler = new TypeScriptCompiler();
var errors = compiler.compile(code);

//the error to look at
var error = errors[0];
var errorPos = error.start;
var message = error.message;
console.log(message, "\n")

var file = compiler.sourceFile;
var program = compiler.oldProgram;
var probablyNeedSemi= ts.probablyUsesSemicolons(file);
var checker = program.getTypeChecker();


    // var file = ts.createSourceFile("inmemory.js", code, {});
    // var program = ts.createProgram(
    //     [FILENAME], this.compilerOptions, this.compilerHost, this.oldProgram
    // );
var node = ts.getTokenAtPosition(file, errorPos)
var parent = node.parent;

var meaning = ts.getMeaningFromLocation(node);
var name = ts.getTextOfNode(node);


var statement = ts.findAncestor(node, ts.isStatement);
var insertPos = statement?.getStart();
// console.log(file?.getLineAndCharacterOfPosition(insertPos))

//make fix
var fix = "var " + name + " = 'Input here'";
//terminate
probablyNeedSemi ? fix += ";\n" : fix += "\n";

//apply
code = code.substring(0, insertPos) + fix + code.substring(insertPos);
console.log(code)

errors = compiler.compile(code);
console.log(errors)

// console.log(errorNode)
    // console.log(file.statements[0].expression)