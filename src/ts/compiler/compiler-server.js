/**
 * @fileoverview The process that the compiler class communicates with.
 */

const TypeScriptCompiler = require("./typescript-compiler");

const compiler = new TypeScriptCompiler();

class CompilerServer{

    /**
     * Calls the TS compiler. If it throws an error, it converts it to a sendable string.
     * @param {sting} code 
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
}

process.on('message', (msg) => {
    var errors = CompilerServer.compile(msg);
    process.send(errors);
});