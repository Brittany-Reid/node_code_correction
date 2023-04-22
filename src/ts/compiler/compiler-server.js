/**
 * @fileoverview The process that the compiler class communicates with.
 */

const TypeScriptCompiler = require("./typescript-compiler");

const compiler = new TypeScriptCompiler();

class CompilerServer{

    /**
     * Calls the TS compiler. If it throws an error, it converts it to a sendable string.
     * @param {string} code 
     * @returns 
     */
    static compile(code){
        try{
            var errors = compiler.compile(code);
            return errors;
        }catch(e){
            return e.message;
        }
    }

    // /**
    //  * Get sourcefile for a string.
    //  * Returns false if string was not last compile.
    //  * @param {string} code String code to lint.
    //  */
    // static getSourceFile(code){
    //     return compiler.getSourceFile(code);
    // }
}

process.on('message', (msg) => {
    var command = msg["command"];
    var arguments = msg["arguments"];

    if(command == "getErrors"){
        var errors = CompilerServer.compile(...arguments);
        process.send(errors);
    }
    //is circular, so this won't work
    // if(command == "getSourceFile"){
    //     var sourceFile = CompilerServer.getSourceFile(...arguments);
    //     process.send(sourceFile);
    // }
});